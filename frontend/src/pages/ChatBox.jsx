import React, { useEffect, useRef, useState } from "react";
import { dummyMessagesData, dummyUserData } from "../assets/assets";
import { ImageIcon, SendHorizonal, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import {
  addMessage,
  fetchMessages,
  resetMessages,
  fetchSuggestions,
  clearSuggestions,
} from "../features/messages/messagesSlice";
import toast from "react-hot-toast";

const ChatBox = () => {
  const { messages, suggestions, loadingSuggestions } = useSelector(
    (state) => state.messages,
  );
  const { userId } = useParams();
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const suggestionsRef = useRef(false);

  const connections = useSelector((state) => state.connections.connections);

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async () => {
    try {
      if (!text && !image) return;

      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text);
      image && formData.append("image", image);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setText("");
        setImage(null);
        dispatch(addMessage(data.message));
        dispatch(clearSuggestions());
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const generateSuggestions = async () => {
    // Prevent multiple simultaneous calls
    if (suggestionsRef.current || loadingSuggestions) return;

    try {
      if (messages.length === 0) {
        toast.error("No messages to get suggestions from");
        return;
      }

      suggestionsRef.current = true;
      const token = await getToken();
      // Send the last message from the conversation to get suggestions
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || !lastMessage.text) {
        toast.error("No valid message to get suggestions for");
        suggestionsRef.current = false;
        return;
      }

      const result = await dispatch(
        fetchSuggestions({ token, messages: [lastMessage] }),
      );
      if (result.payload && typeof result.payload === "string") {
        toast.error(result.payload);
      }
      suggestionsRef.current = false;
    } catch (error) {
      toast.error(error.message);
      suggestionsRef.current = false;
    }
  };

  const useSuggestion = (suggestion) => {
    setText(suggestion);
    dispatch(clearSuggestions());
  };

  useEffect(() => {
    fetchUserMessages();
    dispatch(clearSuggestions());

    return () => {
      dispatch(resetMessages());
      dispatch(clearSuggestions());
    };
  }, [userId]);

  useEffect(() => {
    if (connections.length > 0) {
      const user = connections.find((connection) => connection._id === userId);
      setUser(user);
    }
  }, [connections, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    user && (
      <div className="flex flex-col h-screen">
        <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
          <img
            src={user.profile_picture}
            alt=""
            className="size-8 rounded-full"
          />
          <div>
            <p className="font-medium">{user.full_name}</p>
            <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>
          </div>
        </div>
        <div className="p-5 md:px-10 h-full overflow-y-scroll">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages
              .toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${message.to_user_id !== user._id ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${message.to_user_id !== user._id ? "rounded-bl-none" : "rounded-br-none"}`}
                  >
                    {message.message_type === "image" && (
                      <img
                        src={message.media_url}
                        className="w-full max-w-sm rounded-lg mb-1"
                        alt=""
                      />
                    )}
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="px-4">
          <div className="flex flex-col gap-2 max-w-xl mx-auto mb-3">
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles size={14} /> AI Suggestions:
                </p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => useSuggestion(suggestion)}
                      className="text-left p-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 rounded-lg text-sm text-slate-700 transition cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">
            <input
              type="text"
              className="flex-1 outline-none text-slate-700"
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onChange={(e) => setText(e.target.value)}
              value={text}
            />

            <button
              onClick={generateSuggestions}
              disabled={loadingSuggestions}
              className="text-purple-500 hover:text-purple-700 disabled:text-gray-300 cursor-pointer p-2"
              title="Generate AI suggestions"
            >
              {loadingSuggestions ? (
                <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-500 rounded-full animate-spin"></div>
              ) : (
                <Sparkles size={20} />
              )}
            </button>

            <label htmlFor="image">
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  alt=""
                  className="h-8 rounded"
                />
              ) : (
                <ImageIcon className="size-7 text-gray-400 cursor-pointer" />
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>

            <button
              onClick={sendMessage}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default ChatBox;
