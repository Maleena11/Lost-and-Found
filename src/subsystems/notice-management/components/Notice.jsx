import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { getTempUser, isItemOwner } from "../../../shared/utils/tempUserAuth";
import NoticeSection from "./NoticeSection";

export default function Notice() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab === "found" || tab === "lost" ? tab : "all";
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const user = getTempUser();
    setTempUser(user);
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/lost-found');
      setItems(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const openItemDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/lost-found/${itemId}`, {
        data: { userId: tempUser.id }
      });
      setItems(items.filter(item => item._id !== itemId));
      closeModal();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. " + (error.response?.data?.error || ""));
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === "all") return true;
    return item.itemType === activeTab;
  });

  const userOwnsItem = (item) => {
    return tempUser && item.userId === tempUser.id;
  };

  const getItemImage = (item) => {
    if (item.images && item.images.length > 0) return item.images[0];
    return null;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const tabs = [
    { key: "all", label: "All Items", icon: "fa-th-large" },
    { key: "lost", label: "Lost Items", icon: "fa-search-minus" },
    { key: "found", label: "Found Items", icon: "fa-hand-holding" },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Header />

      {/* Page Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
              <i className="fas fa-home text-xs"></i>
              <span>Home</span>
              <i className="fas fa-chevron-right text-xs"></i>
              <span className="text-white font-medium">Notice Board</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">Campus Lost & Found Board</h1>
            <p className="text-blue-200 text-sm">Browse reported lost and found items across the university campus.</p>
          </div>
          <Link
            to="/report-item"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg flex-shrink-0 w-fit"
          >
            <i className="fas fa-plus"></i>
            Report an Item
          </Link>
        </div>
      </div>

      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <i className={`fas ${tab.icon} text-xs`}></i>
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.key === "all" ? items.length : items.filter(i => i.itemType === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Item Grid / States */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-400">Loading items...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-red-700 text-center flex flex-col items-center gap-2">
            <i className="fas fa-exclamation-circle text-3xl text-red-400"></i>
            <p className="font-medium">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-gray-100 shadow-sm p-12 rounded-2xl text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="fas fa-inbox text-2xl text-gray-300"></i>
            </div>
            <p className="text-gray-600 font-medium">No {activeTab === "all" ? "" : activeTab} items found.</p>
            <p className="text-sm text-gray-400">Be the first to report one!</p>
            <Link
              to="/report-item"
              className="mt-2 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-plus text-xs"></i> Report an Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredItems.map(item => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group relative"
                onClick={() => openItemDetails(item)}
              >
                {/* Your Post badge */}
                {userOwnsItem(item) && (
                  <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                    Your Post
                  </div>
                )}

                {/* Item Type badge */}
                <div className={`absolute top-3 right-3 z-10 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm ${
                  item.itemType === "found" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {item.itemType === "found" ? "Found" : "Lost"}
                </div>

                {/* Image */}
                <div className="h-44 overflow-hidden bg-gray-50 flex items-center justify-center">
                  {getItemImage(item) ? (
                    <img
                      src={getItemImage(item)}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <i className="fas fa-image text-4xl"></i>
                      <span className="text-xs text-gray-400">No image</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate">{item.itemName}</h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
                    <i className="fas fa-map-marker-alt text-gray-400 flex-shrink-0"></i>
                    <span className="truncate">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <i className="fas fa-clock flex-shrink-0"></i>
                    <span>{formatDate(item.dateTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Item Detail Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

              {/* Modal Header */}
              <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${
                selectedItem.itemType === 'found' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedItem.itemType === 'found' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <i className={`fas ${selectedItem.itemType === 'found' ? 'fa-hand-holding text-green-600' : 'fa-search-minus text-red-600'}`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedItem.itemName}</h3>
                    <span className={`text-xs font-semibold ${selectedItem.itemType === 'found' ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedItem.itemType === 'found' ? 'Found Item' : 'Lost Item'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
                >
                  <i className="fas fa-times text-gray-500 text-sm"></i>
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">

                  {/* Left: Image */}
                  <div className="md:w-5/12">
                    {selectedItem.images && selectedItem.images.length > 0 ? (
                      <img
                        src={selectedItem.images[0]}
                        alt={selectedItem.itemName}
                        className="w-full h-52 object-cover rounded-xl mb-3 border border-gray-100"
                      />
                    ) : (
                      <div className="w-full h-52 bg-gray-50 rounded-xl mb-3 flex flex-col items-center justify-center border border-gray-100 gap-2">
                        <i className="fas fa-image text-4xl text-gray-200"></i>
                        <span className="text-xs text-gray-400">No image available</span>
                      </div>
                    )}

                    {/* Additional images */}
                    {selectedItem.images && selectedItem.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedItem.images.slice(1).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`View ${idx + 2}`}
                            className="w-full h-14 object-cover rounded-lg border border-gray-100"
                          />
                        ))}
                      </div>
                    )}

                    {/* Owner actions */}
                    {userOwnsItem(selectedItem) && (
                      <div className="mt-4 flex gap-2">
                        <Link
                          to={`/edit-item/${selectedItem._id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <i className="fas fa-pen text-xs"></i> Edit
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteItem(selectedItem._id); }}
                          disabled={deleteLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {deleteLoading
                            ? <><i className="fas fa-spinner fa-spin text-xs"></i> Deleting...</>
                            : <><i className="fas fa-trash text-xs"></i> Delete</>
                          }
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Details */}
                  <div className="md:w-7/12">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        selectedItem.itemType === "found" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {selectedItem.itemType === "found" ? "Found Item" : "Lost Item"}
                      </span>
                      {selectedItem.category && (
                        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 capitalize">
                          {selectedItem.category.replace(/-/g, ' ')}
                        </span>
                      )}
                      {selectedItem.status && (
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          selectedItem.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          selectedItem.status === 'claimed' ? 'bg-green-100 text-green-700' :
                          selectedItem.status === 'returned' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                        </span>
                      )}
                    </div>

                    {/* Detail Rows */}
                    <div className="space-y-4 mb-5">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="fas fa-align-left text-gray-500 text-xs"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Description</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedItem.description}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="fas fa-map-marker-alt text-gray-500 text-xs"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Campus Location</p>
                          <p className="text-sm text-gray-700">{selectedItem.location}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="fas fa-calendar text-gray-500 text-xs"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Date & Time</p>
                          <p className="text-sm text-gray-700">{formatDate(selectedItem.dateTime)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {selectedItem.contactInfo && Object.values(selectedItem.contactInfo).some(v => v) && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <i className="fas fa-user"></i> Student Contact
                        </p>
                        <div className="space-y-2">
                          {selectedItem.contactInfo.name && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <i className="fas fa-user-circle text-blue-400 w-4 text-center"></i>
                              <span>{selectedItem.contactInfo.name}</span>
                            </div>
                          )}
                          {selectedItem.contactInfo.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <i className="fas fa-phone text-blue-400 w-4 text-center"></i>
                              <span>{selectedItem.contactInfo.phone}</span>
                            </div>
                          )}
                          {selectedItem.contactInfo.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <i className="fas fa-envelope text-blue-400 w-4 text-center"></i>
                              <span>{selectedItem.contactInfo.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notices Section */}
        <NoticeSection />
      </main>

      <Footer />
    </div>
  );
}
