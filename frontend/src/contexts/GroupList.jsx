import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const GROUP_URL = 'http://localhost:3000/api/groups';

const GroupList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(GROUP_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setGroups(data);
            } catch (e) {
                console.error("Failed to fetch groups:", e);
                setError('Failed to load groups. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    if (loading) {
        return <div className="loading">Loading groups...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="group-list">
            {groups.length > 0 ? (
                groups.map(group => {
                    const iconColorClass = group.iconId === 1 ? 'yellow' : 'white';

                    return (
                        <div key={group._id} className="group-item">
                            <div className={`group-icon ${iconColorClass}`}></div>
                            <div className="group-info">
                                <div className="group-name">{group.groupName}</div>
                                <div className="group-date">
                                    {group.startDate ? format(new Date(group.startDate), 'd MMM yyyy') : 'No date'}
                                </div>
                            </div>
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