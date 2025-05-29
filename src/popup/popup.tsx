import React from "react";

const Container = () => {
  return (
    <div>
      <img src={chrome.runtime.getURL("icon-128.png")} alt="icon" />
    <h1>
      Welcome to the Organizer!
    </h1>
  </div>
  )
};

export default Container;