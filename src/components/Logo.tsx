
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="text-princeton-orange font-bold text-xl">
        Me<span className="text-princeton-white">&</span>Union
      </div>
      <div className="w-7 h-7 bg-princeton-orange rounded-full flex items-center justify-center">
        <span className="text-princeton-black font-bold">P</span>
      </div>
    </div>
  );
};

export default Logo;
