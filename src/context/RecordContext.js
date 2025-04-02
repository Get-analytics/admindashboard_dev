// src/context/RecordContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const RecordContext = createContext();

export const useRecordContext = () => {
  return useContext(RecordContext);
};

export const RecordProvider = ({ children }) => {
  const [record, setRecord] = useState(null);
  const [closeDateFilter, setCloseDateFilter] = useState(false); // New state

  const saveRecord = (newRecord) => {
    setRecord(newRecord);
  };

  useEffect(() => {
    if (record) {
      console.log("Updated record:", record);
    }
  }, [record]);

  return (
    <RecordContext.Provider
      value={{
        record,
        saveRecord,
        closeDateFilter,
        setCloseDateFilter,
      }}
    >
      {children}
    </RecordContext.Provider>
  );
};
