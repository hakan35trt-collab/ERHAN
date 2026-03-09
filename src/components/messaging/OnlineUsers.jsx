import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { differenceInMinutes } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function OnlineUsers({ currentUser }) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const allUsers = await User.list();
        const now = new Date();
        const online = allUsers.filter(user => 
          user.last_seen && differenceInMinutes(now, new Date(user.last_seen)) < 5
        );
        setOnlineUsers(online);
      } catch (error) {
        // console.error("Error fetching online users:", error);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 pr-2">
        {onlineUsers.map(user => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <div className="relative">
                {user.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt={user.first_name} className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                    {user.first_name?.charAt(0)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.first_name} {user.last_name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}