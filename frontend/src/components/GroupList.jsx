import React, { useState, useEffect, useContext } from 'react';
import { format } from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/GroupList.css';
import { useNavigate } from 'react-router-dom';

const GROUP_URL = 'http://localhost:3000/api/groups';

const GroupList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [success, setSuccess] = useState(null);

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
                const response = await fetch(GROUP_URL, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setGroups(data);
            } catch (e) {
                setError('Failed to delete group.');
                setTimeout(() => setError(null), 3000);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    const handleDeleteClick = (id) => {
        setGroupToDelete(id);
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(`${GROUP_URL}/${groupToDelete}`,
                {
                    method: 'DELETE',
                    headers:
                    {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!res.ok) throw new Error('Failed to delete');
            setGroups(groups.filter(group => group._id !== groupToDelete));
            setSuccess('Group deleted successfully.');

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to delete group.');
        } finally {
            setShowConfirm(false);
            setGroupToDelete(null);
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
                    const iconColorClass = group.iconId === 1 ? 'yellow' : 'white';

                    return (
                        <div key={group._id} className="group-item" onClick={() => navigate(`/groups/${group._id}`)}>
                            <div className={`group-icon ${iconColorClass}`}></div>
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
                    );
                })
            ) : (
                <div>No groups found.</div>
            )}

            {showConfirm && (
                <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <p>Are you sure you want to delete this group?</p>
                        <div className="modal-buttons">
                            <button onClick={confirmDelete} className="confirm">Yes</button>
                            <button onClick={() => setShowConfirm(false)} className="cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupList;