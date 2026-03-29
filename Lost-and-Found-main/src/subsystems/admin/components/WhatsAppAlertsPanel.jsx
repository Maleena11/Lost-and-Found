import { useState, useEffect } from 'react';
import { api } from '../../../api';

const PRESET_MESSAGES = [
  { label: 'Item may be found',     text: 'Good news! An item matching your lost report may have been found. Please visit the Lost & Found office to verify and collect it.' },
  { label: 'Claim approved',        text: 'Your claim has been approved. Please visit the Lost & Found office with your ID to collect your item.' },
  { label: 'Item expiring soon',    text: 'Reminder: Your reported item is nearing its expiry date. Please contact the Lost & Found office to update your report or collect the item.' },
  { label: 'Verification required', text: 'Additional verification is required for your claim. Please visit the Lost & Found office or reply with supporting details.' },
  { label: 'Custom message…',       text: '' },
];

function initials(name) {
  return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
}

function avatarColor(name) {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
}

export default function WhatsAppAlertsPanel() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customMessage, setCustomMessage]   = useState('');

  // Per-user send state: 'idle' | 'sending' | 'sent' | 'error'
  const [sendState, setSendState] = useState({});

  // Broadcast
  const [broadcasting, setBroadcasting]   = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  useEffect(() => {
    api.get('/users')
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(err => { console.error(err); setUsers([]); })
      .finally(() => setLoading(false));
  }, []);

  const activeMessage = selectedPreset === PRESET_MESSAGES.length - 1
    ? customMessage
    : PRESET_MESSAGES[selectedPreset].text;

  const canSend = activeMessage.trim().length > 0;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || u.name?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
      || u.phonenumber?.includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const withPhone    = filtered.filter(u => u.phonenumber);
  const withoutPhone = filtered.filter(u => !u.phonenumber);

  const setSend = (id, state) => setSendState(prev => ({ ...prev, [id]: state }));

  const sendTo = async (user) => {
    if (!canSend) return;
    setSend(user._id, 'sending');
    try {
      await api.post('/alerts/whatsapp', { phone: user.phonenumber, message: activeMessage });
      setSend(user._id, 'sent');
      setTimeout(() => setSend(user._id, 'idle'), 3000);
    } catch (err) {
      console.error(err);
      setSend(user._id, 'error');
      setTimeout(() => setSend(user._id, 'idle'), 3000);
    }
  };

  const broadcastAll = async () => {
    if (!canSend || withPhone.length === 0) return;
    setBroadcasting(true);
    setBroadcastResult(null);
    let sent = 0, failed = 0;
    for (const user of withPhone) {
      setSend(user._id, 'sending');
      try {
        await api.post('/alerts/whatsapp', { phone: user.phonenumber, message: activeMessage });
        setSend(user._id, 'sent');
        sent++;
      } catch {
        setSend(user._id, 'error');
        failed++;
      }
    }
    setBroadcasting(false);
    setBroadcastResult({ sent, failed });
    setTimeout(() => { setBroadcastResult(null); setSendState({}); }, 5000);
  };

  const roles = ['all', ...Array.from(new Set(users.map(u => u.role).filter(Boolean)))];
  const totalWithPhone = users.filter(u => u.phonenumber).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <i className="fab fa-whatsapp text-green-600 text-base"></i>
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">WhatsApp Alerts</h2>
            <p className="text-xs text-gray-400">Send alerts directly to registered users</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {totalWithPhone} of {users.length} users have a phone number
        </span>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Message composer ── */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</p>

          <div className="flex flex-wrap gap-2">
            {PRESET_MESSAGES.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelectedPreset(i)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  selectedPreset === i
                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {selectedPreset === PRESET_MESSAGES.length - 1 ? (
            <textarea
              rows={3}
              placeholder="Type your custom message…"
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          ) : (
            <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2.5 leading-relaxed">
              {PRESET_MESSAGES[selectedPreset].text}
            </p>
          )}

          {!canSend && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <i className="fas fa-exclamation-triangle text-amber-400 text-[10px]"></i>
              Enter a message before sending.
            </p>
          )}
        </div>

        {/* ── Broadcast result banner ── */}
        {broadcastResult && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
            broadcastResult.failed === 0
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <i className={`fas ${broadcastResult.failed === 0 ? 'fa-check-circle text-green-500' : 'fa-exclamation-triangle text-amber-400'}`}></i>
            Broadcast complete — <strong>{broadcastResult.sent}</strong> sent
            {broadcastResult.failed > 0 && <>, <strong>{broadcastResult.failed}</strong> failed</>}.
          </div>
        )}

        {/* ── Search / filter / broadcast bar ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            {roles.map(r => (
              <option key={r} value={r}>{r === 'all' ? 'All Roles' : r}</option>
            ))}
          </select>
          <button
            onClick={broadcastAll}
            disabled={!canSend || broadcasting || withPhone.length === 0}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {broadcasting
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Broadcasting…</>
              : <><i className="fab fa-whatsapp"></i> Broadcast to All ({withPhone.length})</>
            }
          </button>
        </div>

        {/* ── User list ── */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No users found.</p>
        ) : (
          <div className="space-y-2">
            {withPhone.map(user => {
              const state = sendState[user._id] || 'idle';
              return (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all"
                >
                  <span className={`inline-flex items-center justify-center rounded-full w-9 h-9 text-sm font-semibold text-white flex-shrink-0 ${avatarColor(user.name)}`}>
                    {initials(user.name)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                      {user.role && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role}
                        </span>
                      )}
                      {user.status && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {user.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <i className="fab fa-whatsapp text-green-400 text-[11px]"></i>
                      {user.phonenumber}
                    </p>
                  </div>

                  <button
                    onClick={() => sendTo(user)}
                    disabled={!canSend || state === 'sending'}
                    className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:cursor-not-allowed ${
                      state === 'sent'    ? 'bg-green-100 text-green-700' :
                      state === 'error'   ? 'bg-red-100 text-red-600' :
                      state === 'sending' ? 'bg-gray-100 text-gray-400' :
                                           'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                    }`}
                  >
                    {state === 'sending' && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                    {state === 'sent'    && <i className="fas fa-check text-[10px]"></i>}
                    {state === 'error'   && <i className="fas fa-times text-[10px]"></i>}
                    {state === 'idle'    && <i className="fab fa-whatsapp text-[11px]"></i>}
                    {state === 'sending' ? 'Sending…' : state === 'sent' ? 'Sent!' : state === 'error' ? 'Failed' : 'Send'}
                  </button>
                </div>
              );
            })}

            {/* Users without phone — collapsed */}
            {withoutPhone.length > 0 && (
              <details className="group mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer select-none list-none flex items-center gap-1.5 py-1">
                  <i className="fas fa-chevron-right text-[10px] group-open:rotate-90 transition-transform"></i>
                  {withoutPhone.length} user{withoutPhone.length > 1 ? 's' : ''} without a phone number
                </summary>
                <div className="space-y-1.5 mt-2">
                  {withoutPhone.map(user => (
                    <div key={user._id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-dashed border-gray-200 opacity-50">
                      <span className={`inline-flex items-center justify-center rounded-full w-8 h-8 text-xs font-semibold text-white flex-shrink-0 ${avatarColor(user.name)}`}>
                        {initials(user.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <i className="fas fa-phone-slash text-[10px]"></i> No phone
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
