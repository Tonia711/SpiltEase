import React, { useState, useEffect, useContext } from 'react';
import { format } from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/GroupList.css';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const GROUP_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
const DEFAULT_ICON = `${GROUP_BASE}/groups/defaultIcon.jpg`;

const GroupList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState(null);

    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGroups = async () => {
            if (!token) {
                setError("Authentication token not found.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await api.get("/groups", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = response.data;
                setGroups(data);
            } catch (e) {
                setError('Failed to fetch group.');
                setTimeout(() => setError(null), 3000);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [token]);

    const handleDeleteClick = (id) => {
        setConfirmDeleteGroupId(id);
    };

    const confirmDelete = async (id) => {
        setConfirmDeleteGroupId(null);

        try {
            await api.delete(`/groups/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setGroups(groups.filter(group => group._id !== groupToDelete));
            setSuccess('Group deleted successfully.');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to delete group.');
            setTimeout(() => setError(null), 3000);
        } finally {
        }
    };

    if (loading) {
        return <div className="loading">Loading groups...</div>;
    }

    return (
        <div className="group-list">

            {success && (
                <div className="toast-success">
                    {success}
                </div>
            )}

            {error && (
                <div className="toast-error">
                    {error}
                </div>
            )}

            {groups.length > 0 ? (
                groups.map(group => {
                    return (
                        <div key={group._id}>
                            <div className="group-item" onClick={() => navigate(`/groups/${group._id}/expenses`)}>
                                <img
                                    src={group.iconUrl ? `${GROUP_BASE}/${group.iconUrl}` : DEFAULT_ICON}
                                    alt=""
                                    className="group-icon"
                                />

                                <div className="group-info">
                                    <div className="group-name">{group.groupName}</div>
                                    <div className="group-date">
                                        {group.startDate ? format(new Date(group.startDate), 'd MMM yyyy') : 'No date'}
                                    </div>
                                </div>
                                <button
                                    className="delete-btn"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeleteClick(group._id)
                                    }}
                                > X
                                </button>
                            </div>

                            {confirmDeleteGroupId === group._id && (
                                <div className="group-card confirm-card">
                                    <div className="confirm-text">Are you sure you want to leave this group?</div>
                                    <div className="confirm-buttons">
                                        <button className="confirm-btn yes" onClick={() => confirmDelete(group._id)}>Delete</button>
                                        <button className="confirm-btn no" onClick={() => setConfirmDeleteGroupId(null)}>Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div>No groups found.</div>
            )}
        </div>
    );
};

export default GroupList;