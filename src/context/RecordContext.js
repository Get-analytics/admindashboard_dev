// src/context/RecordContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const RecordContext = createContext();

export const useRecordContext = () => {
  return useContext(RecordContext);
};

export const RecordProvider = ({ children }) => {
  const [record, setRecord] = useState(null);

  const saveRecord = (newRecord) => {
    setRecord(newRecord);
  };

  // Log the record whenever it changes
  useEffect(() => {
    if (record) {
      console.log("Updated record:", record);
    }
  }, [record]); // Dependency array, so it runs when 'record' changes

  return (
    <RecordContext.Provider value={{ record, saveRecord }}>
      {children}
    </RecordContext.Provider>
  );
};
