import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useConversationTimestamps = () => {
  const [conversationTimestamps, setConversationTimestamps] = useState({});

  const loadTimestamps = useCallback(async () => {
    try {
      const timestampsString = await AsyncStorage.getItem("conversationTimestamps");
      if (timestampsString) {
        const timestamps = JSON.parse(timestampsString);
        setConversationTimestamps(timestamps);
        return timestamps;
      }
      return {};
    } catch (e) {
      console.error("Error loading conversation timestamps:", e);
      return {};
    }
  }, []);

  const saveTimestamp = useCallback(async (userId) => {
    try {
      const timestamp = Date.now() + Math.floor(Math.random() * 10);
      const timestampsStr = await AsyncStorage.getItem("conversationTimestamps");
      let timestamps = {};

      if (timestampsStr) {
        try {
          timestamps = JSON.parse(timestampsStr);
        } catch (e) {
          console.error("Error parsing timestamps:", e);
        }
      }

      const newTimestamps = { ...timestamps, [userId]: timestamp };
      await AsyncStorage.setItem("conversationTimestamps", JSON.stringify(newTimestamps));
      setConversationTimestamps(newTimestamps);
      return newTimestamps;
    } catch (e) {
      console.error("Error saving conversation timestamp:", e);
      return conversationTimestamps;
    }
  }, [conversationTimestamps]);

  const updateTimestamp = useCallback((userId, timestamp) => {
    setConversationTimestamps(prev => ({
      ...prev,
      [userId]: timestamp
    }));
  }, []);

  const removeTimestamp = useCallback(async (userId) => {
    try {
      const timestampsString = await AsyncStorage.getItem("conversationTimestamps");
      if (timestampsString) {
        const timestamps = JSON.parse(timestampsString);
        if (timestamps[userId]) {
          delete timestamps[userId];
          await AsyncStorage.setItem("conversationTimestamps", JSON.stringify(timestamps));
          setConversationTimestamps(timestamps);
        }
      }
    } catch (e) {
      console.error("Error removing timestamp:", e);
    }
  }, []);

  return {
    conversationTimestamps,
    setConversationTimestamps,
    loadTimestamps,
    saveTimestamp,
    updateTimestamp,
    removeTimestamp,
  };
};
