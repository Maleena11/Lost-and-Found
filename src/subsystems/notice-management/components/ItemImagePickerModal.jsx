import { useState, useEffect } from "react";
import axios from "axios";

export default function ItemImagePickerModal({ onSelect, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/lost-found/")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        // Only keep items that have at least one image
        setItems(data.filter((item) => item.images && item.images.length > 0));
      })
      .catch(() => setError("Failed to load item reports."))
      .finally(() => setLoading(false));
  }, []);

  const toggleImage = (base64) => {
    setSelected((prev) =>
      prev.includes(base64) ? prev.filter((s) => s !== base64) : [...prev, base64]
    );
  };

  const handleConfirm = () => {
    if (selected.length > 0) {
      onSelect(selected);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">

      {/* Lightbox */}
      {lightbox && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
            onClick={() => setLightbox(null)}
          >
            <i className="fas fa-times"></i>
          </button>
          <img
            src={lightbox}
            alt="Full view"
            className="max-w-lg w-full mx-6 rounded-2xl shadow-2xl object-contain max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-blue-800">Select from Item Reports</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Click images to select them. Selected images will be added to the notice.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-b-4"></div>
            </div>
          )}

          {error && (
            <div className="text-center text-red-600 py-10">{error}</div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              No item reports with images found.
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-5">
              {items.map((item) => (
                <div key={item._id} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {item.itemName || "Unnamed Item"}
                    <span className="ml-2 text-xs font-normal text-gray-400 capitalize">
                      ({item.itemType} · {item.category})
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {item.images.map((img, idx) => {
                      const isSelected = selected.includes(img);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleImage(img)}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group/img ${
                            isSelected
                              ? "border-blue-500 ring-2 ring-blue-300"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${item.itemName} image ${idx + 1}`}
                            className="h-20 w-20 object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow">
                                <i className="fas fa-check text-white text-xs"></i>
                              </div>
                            </div>
                          )}
                          {/* Zoom button */}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setLightbox(img); }}
                            className="absolute bottom-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <i className="fas fa-search-plus text-[10px]"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <span className="text-sm text-gray-500">
            {selected.length > 0
              ? `${selected.length} image${selected.length > 1 ? "s" : ""} selected`
              : "No images selected"}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm transition-colors disabled:bg-blue-300"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
