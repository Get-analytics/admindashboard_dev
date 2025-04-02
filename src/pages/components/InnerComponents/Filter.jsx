// src/components/InnerComponents/Filter.js
import React, { useState, useEffect } from "react";
import { DatePicker, Space } from "antd";
import { useRecordContext } from "../../../context/RecordContext";

const { RangePicker } = DatePicker;

const DateRangePicker = () => {
  const [dates, setDates] = useState([]);
  const [selectedRange, setSelectedRange] = useState("");
  const { setCloseDateFilter } = useRecordContext(); // Access context value

  const handleDateChange = (value) => {
    if (value && value.length === 2) {
      setSelectedRange(
        `From: ${value[0].format("YYYY-MM-DD")} To: ${value[1].format("YYYY-MM-DD")}`
      );
      setCloseDateFilter(true); // Automatically close modal
    } else {
      setSelectedRange("Select a date range");
    }
    setDates(value);
  };

  return (
    <div style={{ margin: "10px" }}>
      <Space direction="vertical">
        <RangePicker
          value={dates}
          onChange={handleDateChange}
          style={{ width: 400 }}
          format="YYYY-MM-DD"
          allowClear={false}
        />
        <div style={{ marginTop: "10px" }}>
          <h4>{selectedRange}</h4>
        </div>
      </Space>
    </div>
  );
};

export default DateRangePicker;
