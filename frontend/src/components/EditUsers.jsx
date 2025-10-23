import React from "react"
import { Link } from "react-router-dom";
import '../styles/EditUsers.css';

const placeHolderUsers = [
    { email: "pertti@testi.fi", role: "gamemaster" },
    { email: "jaska@testi.fi", role: "gamemaster" },
    { email: "pekka@testi.fi", role: "gamemaster" },
    { email: "kalle@testi.fi", role: "gamemaster" },
    { email: "janne@testi.fi", role: "gamemaster" },
    { email: "sanna@testi.fi", role: "gamemaster" }
]

const EditUsers = () => {
  return (
    <div className="edit-page">
      <div className="existing-users">
        <h1>Existing users</h1>
        <div className="user-boxes">
          {placeHolderUsers.map((user, index) => (
          <button className="user-box" key={index}>
            {user.email}, {user.role}
          </button>
          ))}
        </div>
      </div>
      <div className="pending-users">
        <h1>Pending users</h1>
      </div>
    </div>
    );
};

export default EditUsers