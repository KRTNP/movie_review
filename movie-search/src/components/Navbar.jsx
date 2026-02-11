import React, { memo, useMemo, useState, useEffect, useRef } from "react";
import {
    FaMagnifyingGlass,
    FaShuffle,
    FaSliders,
    FaXmark,
    FaChevronDown,
    FaRotateLeft,
    FaCalendarDays,
    FaStar,
    FaFire,
    FaGlobe,
    FaUser,
    FaTag,
    FaArrowUp,
    FaFlask,
    FaFilm
} from "react-icons/fa6";

const FilterInput = ({ label, icon: Icon, ...props }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-700 ml-1">
            {label}
        </label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="text-gray-400 group-focus-within:text-black transition-colors text-sm" />
            </div>
            <input
                {...props}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                         text-sm text-gray-900 placeholder-gray-400
                         focus:bg-white focus:ring-2 focus:ring-black/10 focus:border-black
                         hover:border-gray-300 transition-all outline-none"
            />
        </div>
    </div>
);

const FilterSelect = ({ label, icon: Icon, value, onChange, options, defaultOption = "ทั้งหมด" }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-700 ml-1">
            {label}
        </label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="text-gray-400 group-focus-within:text-black transition-colors text-sm" />
            </div>
            <select
                value={value}
                onChange={onChange}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                         text-sm text-gray-900 appearance-none cursor-pointer
                         focus:bg-white focus:ring-2 focus:ring-black/10 focus:border-black
                         hover:border-gray-300 transition-all outline-none"
            >
                <option value="">{defaultOption}</option>
                {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.name}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <FaChevronDown size={10} />
            </div>
        </div>
    </div>
);

const Navbar = ({
    onSearch,
    searchValue,
    searchMode,
    setSearchMode,
    searchSuggestions = [],
    searchLoading,
    onPickSuggestion,
    genres,
    filters,
    setFilters,
    onRandom,
    filtersOpen,
    onToggleFilters,
    view,
    onChangeView,
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);

    // ปิด Suggestions เมื่อคลิกที่อื่น
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // เปิด Suggestions เมื่อมีข้อมูล
    useEffect(() => {
        if (searchSuggestions.length > 0) {
            setShowSuggestions(true);
        }
    }, [searchSuggestions]);

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 60 }, (_, i) => {
            const y = currentYear - i;
            return { id: y, name: String(y) };
        });
    }, []);

    const ratingOptions = [
        { id: 9, name: "9+ (ยอดเยี่ยม)" },
        { id: 8, name: "8+ (ดีมาก)" },
        { id: 7, name: "7+ (ดี)" },
        { id: 6, name: "6+ (พอใช้)" },
        { id: 5, name: "5+ (ปานกลาง)" },
    ];

    const popularityOptions = [
        { id: 2000, name: "2000+ (หนังฟอร์มยักษ์)" },
        { id: 1000, name: "1000+ (ดังระเบิด)" },
        { id: 500, name: "500+ (กำลังฮิต)" },
        { id: 100, name: "100+ (ยอดนิยม)" },
        { id: 50, name: "50+ (ทั่วไป)" },
    ];

    const handleResetFilters = () => {
        setFilters({
            genre: "",
            year: "",
            rating: "",
            popularity: "",
            language: "en",
            actor: "",
            sort: "popularity.desc",
        });
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
            <div className="w-full px-6 py-4">
                <div className="flex items-center gap-4 flex-wrap justify-between">

                    {/* Logo Section */}
                    <div
                        className="flex items-center gap-3 cursor-pointer group select-none"
                        onClick={() => window.location.reload()}
                    >
                        <div className="bg-black text-white p-2.5 rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg shadow-black/20">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M19.82 2H4.18C2.97 2 2 2.97 2 4.18v15.64C2 21.03 2.97 22 4.18 22h15.64c1.21 0 2.18-.97 2.18-2.18V4.18C22 2.97 21.03 2 19.82 2z" />
                                <path d="M7 2v20" />
                                <path d="M17 2v20" />
                                <path d="M2 12h20" />
                                <path d="M2 7h5" />
                                <path d="M2 17h5" />
                                <path d="M17 17h5" />
                                <path d="M17 7h5" />
                            </svg>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="text-xl font-black tracking-tighter leading-none text-gray-900">
                                NHANG<span className="text-gray-300">DEEMAI</span>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar with Suggestions */}
                    <div className="flex-1 max-w-xl relative group" ref={searchRef}>
                        <div className="relative flex items-center w-full">
                            {/* Mode Switcher */}
                            <div className="absolute left-1 z-10 flex bg-gray-100 rounded-full p-1">
                                <button
                                    onClick={() => setSearchMode("movie")}
                                    className={`p-1.5 rounded-full transition-all ${searchMode === "movie" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-gray-600"}`}
                                    title="ค้นหาหนัง"
                                >
                                    <FaFilm size={12} />
                                </button>
                                <button
                                    onClick={() => setSearchMode("actor")}
                                    className={`p-1.5 rounded-full transition-all ${searchMode === "actor" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-gray-600"}`}
                                    title="ค้นหาดารา"
                                >
                                    <FaUser size={12} />
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder={searchMode === "movie" ? "ค้นหาหนัง..." : "ค้นหาดารา..."}
                                value={searchValue}
                                onChange={(e) => onSearch(e.target.value)}
                                onFocus={() => {
                                    if (searchSuggestions.length > 0) setShowSuggestions(true);
                                }}
                                className="w-full pl-20 pr-10 py-3 bg-gray-50 text-gray-900 placeholder-gray-400 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-gray-200 transition-all shadow-sm group-hover:bg-white group-hover:border-gray-200"
                            />

                            {/* Loading / Clear / Search Icon */}
                            <div className="absolute right-4 flex items-center gap-2">
                                {searchLoading ? (
                                    <div className="w-4 h-4 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                                ) : searchValue ? (
                                    <button
                                        onClick={() => onSearch("")}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <FaXmark />
                                    </button>
                                ) : (
                                    <FaMagnifyingGlass className="text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[60] animate-fade-in-up">
                                <div className="p-2">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1 mb-1">
                                        ผลการค้นหาแนะนำ
                                    </div>
                                    {searchSuggestions.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                onPickSuggestion(item);
                                                setShowSuggestions(false);
                                            }}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors"
                                        >
                                            <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                {item.profile_path || item.poster_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w92${item.profile_path || item.poster_path}`}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        {searchMode === "movie" ? <FaFilm /> : <FaUser />}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800 group-hover:text-black line-clamp-1">
                                                    {item.title}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {item.subtitle || "-"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onChangeView(view === "model" ? "home" : "model")}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${view === "model"
                                ? "bg-black text-white shadow-lg shadow-black/20"
                                : "bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black"
                                }`}
                        >
                            <FaFlask aria-hidden="true" className={view === "model" ? "text-white" : "text-gray-400"} />
                            <span className="hidden sm:inline">ทดสอบโมเดล</span>
                            <span className="sm:hidden">Test</span>
                        </button>

                        <button
                            onClick={onToggleFilters}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${filtersOpen
                                ? "bg-black text-white shadow-lg shadow-black/20"
                                : "bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black"
                                }`}
                        >
                            <FaSliders aria-hidden="true" className={filtersOpen ? "text-white" : "text-gray-400"} />
                            <span className="hidden sm:inline">ตัวกรอง</span>
                        </button>

                        <button
                            onClick={onRandom}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-900 text-sm font-bold tracking-wide hover:bg-black hover:text-white hover:border-black transition-all duration-300 group"
                        >
                            <FaShuffle aria-hidden="true" className="text-gray-400 group-hover:text-white transition-colors" />
                            <span className="hidden sm:inline">สุ่มหนัง</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out border-b border-gray-100 bg-white ${filtersOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-none"
                    }`}
            >
                <div className="px-6 py-8 container mx-auto max-w-[1600px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-black flex items-center gap-2">
                            <FaSliders className="text-black" />
                            กำหนดเงื่อนไขการค้นหา
                        </h3>
                        <button
                            onClick={handleResetFilters}
                            className="text-xs text-gray-500 hover:text-red-600 font-semibold bg-gray-100 hover:bg-red-50 px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors"
                        >
                            <FaRotateLeft /> ล้างค่าทั้งหมด
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                        <FilterSelect
                            label="ประเภทหนัง"
                            icon={FaTag}
                            value={filters.genre}
                            onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value }))}
                            options={genres}
                            defaultOption="ทุกประเภท"
                        />

                        <FilterSelect
                            label="ปีที่ฉาย"
                            icon={FaCalendarDays}
                            value={filters.year}
                            onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
                            options={yearOptions}
                            defaultOption="ทุกปี"
                        />

                        <FilterSelect
                            label="คะแนนขั้นต่ำ"
                            icon={FaStar}
                            value={filters.rating}
                            onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value }))}
                            options={ratingOptions}
                            defaultOption="ทุกระดับ"
                        />

                        <FilterSelect
                            label="ความนิยมขั้นต่ำ"
                            icon={FaFire}
                            value={filters.popularity}
                            onChange={(e) => setFilters((f) => ({ ...f, popularity: e.target.value }))}
                            options={popularityOptions}
                            defaultOption="ทั้งหมด"
                        />

                        <FilterSelect
                            label="เรียงลำดับ"
                            icon={FaArrowUp}
                            value={filters.sort}
                            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
                            defaultOption="ความนิยม (มาก → น้อย)"
                            options={[
                                { id: "popularity.desc", name: "ความนิยม (มาก → น้อย)" },
                                { id: "popularity.asc", name: "ความนิยม (น้อย → มาก)" },
                                { id: "vote_average.desc", name: "คะแนน (มาก → น้อย)" },
                                { id: "vote_average.asc", name: "คะแนน (น้อย → มาก)" },
                                { id: "release_date.desc", name: "ใหม่ → เก่า" },
                                { id: "release_date.asc", name: "เก่า → ใหม่" },
                            ]}
                        />

                        <FilterSelect
                            label="ภาษาต้นฉบับ"
                            icon={FaGlobe}
                            value={filters.language}
                            onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
                            defaultOption="อังกฤษ (ค่าเริ่มต้น)"
                            options={[
                                { id: 'en', name: 'อังกฤษ (English)' },
                                { id: 'th', name: 'ไทย (Thai)' },
                                { id: 'ja', name: 'ญี่ปุ่น (Japanese)' },
                                { id: 'ko', name: 'เกาหลี (Korean)' },
                                { id: 'zh', name: 'จีน (Chinese)' },
                                { id: 'fr', name: 'ฝรั่งเศส (French)' },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default memo(Navbar);
