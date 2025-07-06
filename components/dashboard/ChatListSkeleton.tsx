import React from 'react';


interface ChatListSkeletonProps {
  isExpanded: boolean;
}

export const ChatListSkeleton: React.FC<ChatListSkeletonProps> = ({ isExpanded }) => {
  return (
    <div className="space-y-3 px-3 py-2">
      {[...Array(isExpanded ? 5 : 3)].map((_, i) => (
        <div key={i} className={`flex items-center ${isExpanded ? 'space-x-3 p-2' : 'justify-center p-1.5'} rounded-lg bg-white/50 animate-pulse`}>
          <div className={`${isExpanded ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-gray-200`}></div>
          {isExpanded && (
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatListSkeleton; 