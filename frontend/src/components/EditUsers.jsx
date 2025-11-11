import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import '../styles/EditUsers.css';
import Snackbar from "./ui/snackbar"
import { API_BASE } from "../api";
import { useAuth } from '../context/AuthContext';

const placeHolderUsers = [
  { email: "pertti@testi.fi", role: "gamemaster" },
  { email: "jaska@testi.fi", role: "gamemaster" },
  { email: "pekka@testi.fi", role: "gamemaster" },
  { email: "kalle@testi.fi", role: "gamemaster" },
  { email: "janne@testi.fi", role: "gamemaster" },
  { email: "sanna@testi.fi", role: "gamemaster" }
]

const EditUsers = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedOption, setSelectedOption] = useState("gamemaster");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingUsers, setPendingUsers] = useState([])
  const [existingUsers, setExistingUsers] = useState([])
  const { user } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log("loading users");
      const res = await fetch(`${API_BASE}/load_users`);
      const data = await res.json();
      setPendingUsers(data.filter(user => user.pending));
      setExistingUsers(data.filter(user => !user.pending));
    } finally {
      console.log("loading complete");
    }
  };

  const handleAccept = async () => {
    setIsSaving(true);
    try {
      const response = await acceptUser();
      if (response.ok) {
        setExistingUsers([...existingUsers, {email: selectedUser, role: selectedOption}]);
        const updatedUsers = pendingUsers.filter(u => u.email !== selectedUser);
        setPendingUsers(updatedUsers);
      }

      if (!response.ok) {
        let errorMsg = "Failed to accept user.";
        try {
          const data = await response.json();
          if (data?.error) {
            errorMsg = ` ${data.error}`;
          }
        } catch {
          // ignore JSON parse errors
        }
        setSnackbarMessage(errorMsg);
        setShowSnackbar(true);
        return;
      }

      setSnackbarMessage("User accepted successfully!");
      setShowSnackbar(true);
    } catch (err) {
      console.error("Accept failed:", err);
      setSnackbarMessage("Failed to accept user (network error).");
      setShowSnackbar(true);
    } finally {
      setIsSaving(false)
    }
    setShowPopup(false);
    setSelectedUser("");
  };

  const handleDeny = async (email) => {
    const confirmBox = window.confirm(
      `Are you sure you want to deny ${email}?`
    )
    if (!confirmBox) {
      setSelectedUser("")
      setSnackbarMessage("Deny canceled");
      setShowSnackbar(true);
      return;
    }
    setIsDeleting(true)
    try {
      const response = await removeUser(email);
      if (response.ok) {
        const updatedUsers = pendingUsers.filter(u => u.email !== email);
        setPendingUsers(updatedUsers);
      }

      if (!response.ok) {
        let errorMsg = "Failed to deny user.";
        try {
          const data = await response.json();
          if (data?.error) {
            errorMsg = ` ${data.error}`;
          }
        } catch {
          // ignore JSON parse errors
        }
        setSnackbarMessage(errorMsg);
        setShowSnackbar(true);
        return;
      }

      setSnackbarMessage("User denied successfully!");
      setShowSnackbar(true);
    } catch (err) {
      console.error("Deny failed:", err);
      setSnackbarMessage("Failed to deny user (network error).");
      setShowSnackbar(true);
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRemove = async (email) => {
    const confirmBox = window.confirm(
      `Are you sure you want to remove ${email}?`
    )
    if (!confirmBox) {
      setSelectedUser("")
      setSnackbarMessage("Remove canceled");
      setShowSnackbar(true);
      return;
    }
    setIsDeleting(true)
    try {
      const response = await removeUser(email);
      if (response.ok) {
        const updatedUsers = existingUsers.filter(u => u.email !== email);
        setExistingUsers(updatedUsers);
      }

      if (!response.ok) {
        let errorMsg = "Failed to remove user.";
        try {
          const data = await response.json();
          if (data?.error) {
            errorMsg = ` ${data.error}`;
          }
        } catch {
          // ignore JSON parse errors
        }
        setSnackbarMessage(errorMsg);
        setShowSnackbar(true);
        return;
      }

      setSnackbarMessage("User removed successfully!");
      setShowSnackbar(true);
    } catch (err) {
      console.error("Remove failed:", err);
      setSnackbarMessage("Failed to remove user (network error).");
      setShowSnackbar(true);
    } finally {
      setIsDeleting(false)
    }
    }

  const handlePromote = async (email) => {
    const confirmBox = window.confirm(`Promote ${email} to admin?`);
    if (!confirmBox) return;

    setIsSaving(true);

    try {
      const response = await changeUserRole(email, "admin");
      if (response.ok) {
        const updatedUsers = existingUsers.map(u => 
          u.email === email ? { ...u, role: "admin" } : u
        );
        setExistingUsers(updatedUsers);
        setSnackbarMessage("User promoted successfully");
        setShowSnackbar(true);
      } else {
        let errorMsg = "Failed to promote user";
        try {
          const data = await response.json();
          if (data?.error) errorMsg = data.error;
        } catch (err) {
          console.error(errorMsg);
        }
      }
    } catch (err) {
      console.error("Promotion error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDemote = async (email) => {
    const confirmBox = window.confirm(`Demote ${email} to gamemaster?`);
    if (!confirmBox) return;

    setIsSaving(true);

    try {
      const response = await changeUserRole(email, "gamemaster");
      if (response.ok) {
        const updatedUsers = existingUsers.map(u => 
          u.email === email ? { ...u, role: "gamemaster" } : u
        );
        setExistingUsers(updatedUsers);
        setSnackbarMessage("User demoted successfully");
        setShowSnackbar(true);
      } else {
        let errorMsg = "Failed to demote user";
        try {
          const data = await response.json();
          if (data?.error) errorMsg = data.error;
        } catch (err) {
          console.error(errorMsg);
        }
      }
    } catch (err) {
      console.error("Demotion error:", err);
    } finally {
      setIsSaving(false);
    }
  };



  const removeUser = (userEmail) => {
    return fetch(`${API_BASE}/remove_user`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
      }),
    });
  };

  const acceptUser = () => {
    return fetch(`${API_BASE}/accept_user`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: selectedUser,
        role: selectedOption,
        pending: false
      })
    });
  };

    const changeUserRole = (email, newrole) => {
    return fetch(`${API_BASE}/accept_user`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        role: newrole,
        pending: false
      })
    });
  };

return (
  <>
    <Snackbar
      message={snackbarMessage}
      show={showSnackbar}
      onClose={() => setShowSnackbar(false)}
    />

    <div className="edit-page">
      <div className="header">
        <h1>User management</h1>
        <h3>Manage all users in one place. Control roles and pending user requests. Pending user request will appear on top of the existing user table.</h3>
      </div>
      <div className="table-area">
      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <div className="table-wrapper">
          <h2>Pending users</h2>
          <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Accept / Deny</th>
            </tr>
          </thead>
            <tbody>
              {pendingUsers.map((u, index) => (
                <tr key={index}>
                  <td>👤 {u.email}</td>
                  <td>
                    <div className="requestbuttons">
                    <button
                      className="accept-button"
                      title="Accept"
                      onClick={() => {
                        setSelectedUser(u.email);
                        setShowPopup(true);
    
                      }}
                    >
                      ✅
                    </button>
                    <button
                      className="remove-button"
                      onClick={() => handleDeny(u.email)}
                      title="Reject"
                    >
                      🗙
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Existing Users */}
      <div className="table-wrapper">
        <h2>Existing users</h2>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {existingUsers.map((u, index) => (
              <tr key={index}>
                <td>👤 {u.email}</td>
                <td>{u.role}</td>
                <td>
                  {u.email !== user?.email && (
                    <div className="editbuttons">
                    <>
                    {u.role == "gamemaster" && (
                      <button
                        className="promote-button"
                        onClick={() => handlePromote(u.email)}
                        title= "Promote"
                      >
                        ⬆️
                      </button>
                    )}
                      {u.role == "admin" && (
                      <button
                        className="demote-button"
                        onClick={() => handleDemote(u.email)}
                        title="Demote"
                      >
                        ⬇️
                      </button>
                      )}
                                         <button
                        className="remove-button"
                        onClick={() => handleRemove(u.email)}
                        title= "Delete"
                      >
                        🗙
                      </button>
                    </>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Accept User</h2>

            <div className="options">
              <p>Select a role for {selectedUser}:</p>

              <label>
                <input
                  type="radio"
                  name="choice"
                  value="admin"
                  checked={selectedOption === "admin"}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                Admin
              </label>

              <label>
                <input
                  type="radio"
                  name="choice"
                  value="gamemaster"
                  checked={selectedOption === "gamemaster"}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                Gamemaster
              </label>
            </div>

            <div className="buttons">
              <button onClick={handleAccept}>Accept</button>
              <button
                onClick={() => {
                  setShowPopup(false);
                  setSelectedUser("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </>
);
};

export default EditUsers;
