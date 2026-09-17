import React from "react";

const DropdownPage = ({
  reqEntries,
}: {
  reqEntries: (data: number) => void;
}) => {
  const onChangeHandler = (value: string) => {
    reqEntries(Number(value));
  };
  return (
    <div className="row mt-4 col-5">
      <p className="col align-center col-3 my-auto">Show entries</p>
      <div className="col dropdown col-2 my-auto">
        <select
          className="custom-select border-light w-fit px-2"
          defaultValue={4}
          onChange={(e) => onChangeHandler(e.target.value)}
        >
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="12">12</option>
        </select>
      </div>
    </div>
  );
};

export default DropdownPage;
