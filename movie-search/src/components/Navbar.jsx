import React from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";

const Navbar = ({ onSearch, searchValue }) => {
    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
            <div className="w-full px-6 py-3">
                <div className="flex justify-between items-center gap-4">
                    <div
                        className="flex items-center gap-2 cursor-pointer flex-shrink-0"
                        onClick={() => window.location.reload()}
                    >
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <path d="M7 3v18" />
                                <path d="M3 7.5h4" />
                                <path d="M3 12h18" />
                                <path d="M3 16.5h4" />
                                <path d="M17 3v18" />
                                <path d="M17 7.5h4" />
                                <path d="M17 16.5h4" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-800 tracking-tight">
                            Nhang<span className="text-indigo-600">DeeMai</span>
                        </span>
                    </div>

                    <div className="flex-1 max-w-md relative">
                        <input
                            type="text"
                            // แก้ไข: เปลี่ยน placeholder ให้สื่อความหมาย
                            placeholder="ค้นหาภาพยนตร์..."
                            value={searchValue}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-800"
                        />
                        <FaMagnifyingGlass
                            className="absolute left-3 top-2.5 text-gray-400"
                            aria-hidden="true"
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
