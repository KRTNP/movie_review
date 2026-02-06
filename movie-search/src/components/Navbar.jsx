import React from 'react';

const Navbar = ({ onSearch, searchValue }) => {
    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
            {/* แก้ตรงนี้: เปลี่ยน max-w-7xl mx-auto เป็น w-full */}
            <div className="w-full px-6 py-3">
                <div className="flex justify-between items-center gap-4">

                    {/* Logo Brand */}
                    <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => window.location.reload()}>
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></svg>
                        </div>
                        <span className="text-xl font-bold text-gray-800 tracking-tight">
                            Nhang<span className="text-indigo-600">DeeMai</span>
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
                        <a href="/movie-search/src/App.jsx" className="hover:text-indigo-600 transition p-3 px-6 bg-indigo-50 rounded-lg">หน้าแรก</a>
                        <a href="#" className="hover:text-indigo-600 transition p-3 px-6 bg-indigo-50 rounded-lg">รีวิวล่าสุด</a>
                        <a href="#" className="hover:text-indigo-600 transition p-3 px-6 bg-indigo-50 rounded-lg">จัดอันดับ</a>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-md relative">
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อหนัง..."
                            value={searchValue}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-800"
                        />
                        <svg className="absolute left-3 top-2.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default Navbar;