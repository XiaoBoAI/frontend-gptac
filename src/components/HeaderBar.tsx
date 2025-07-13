import React from 'react';

interface HeaderBarProps {
  username: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ username }) => {
  return (
    <div className="header-bar py-6 px-8 text-2xl font-bold text-center border-b bg-white">
      下午好，{username}
    </div>
  );
};

export default HeaderBar; 