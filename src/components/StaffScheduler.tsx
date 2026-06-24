import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, UserPlus, Users, DollarSign, 
  CheckCircle, XCircle, AlertCircle, Sparkles, Plus, FileSpreadsheet
} from 'lucide-react';
import { StaffMember, Shift } from '../types';

interface StaffSchedulerProps {
  staff: StaffMember[];
  shifts: Shift[];
  onAddShift: (shift: Omit<Shift, 'id' | 'totalHours' | 'payAmount'>) => void;
  onUpdateShiftStatus: (shiftId: string, status: 'Scheduled' | 'Completed' | 'Canceled') => void;
  onAddStaff: (member: Omit<StaffMember, 'id'>) => void;
}

export const StaffScheduler: React.FC<StaffSchedulerProps> = ({
  staff,
  shifts,
  onAddShift,
  onUpdateShiftStatus,
  onAddStaff
}) => {
  const [activeTab, setActiveTab] = useState<'shifts' | 'members'>('shifts');
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);

  // New Shift form state
  const [shiftFormData, setShiftFormData] = useState({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '00:00'
  });

  // New Staff member form state
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    role: 'Bartender' as any,
    contact: '',
    hourlyRate: 300
  });

  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftFormData.staffId || !shiftFormData.date) return;

    const member = staff.find(s => s.id === shiftFormData.staffId);
    if (!member) return;

    onAddShift({
      staffId: shiftFormData.staffId,
      staffName: member.name,
      role: member.role,
      date: shiftFormData.date,
      startTime: shiftFormData.startTime,
      endTime: shiftFormData.endTime,
      status: 'Scheduled'
    });

    setShowShiftForm(false);
    alert('Shift scheduled successfully! Staff will receive a system alert.');
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormData.name) return;

    onAddStaff({
      name: staffFormData.name,
      role: staffFormData.role,
      contact: staffFormData.contact || '+254 700 000 000',
      hourlyRate: Number(staffFormData.hourlyRate)
    });

    setShowStaffForm(false);
    setStaffFormData({ name: '', role: 'Bartender', contact: '', hourlyRate: 300 });
    alert('New staff profile registered successfully.');
  };

  // Quick formatter
  const formatKES = (value: number) => `KES ${value.toLocaleString()}`;

  return (
    <div id="staff-scheduler" className="mt-6">
      <div className="flex border-b border-brand-card-light pb-0.5 gap-6 mb-6">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 ${
            activeTab === 'shifts'
              ? 'border-brand-emerald text-brand-emerald font-bold'
              : 'border-transparent text-brand-light/60 hover:text-white'
          }`}
        >
          Shift Roster & Schedules
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 ${
            activeTab === 'members'
              ? 'border-brand-emerald text-brand-emerald font-bold'
              : 'border-transparent text-brand-light/60 hover:text-white'
          }`}
        >
          Staff Directory ({staff.length})
        </button>
      </div>

      {activeTab === 'shifts' && (
        <div className="space-y-4">
          {/* Action Row */}
          <div className="bg-brand-card border border-brand-card-light p-4 rounded-xl flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm font-display">Weekly Shift Grid</h4>
              <p className="text-xs text-brand-light/50">Schedule bartenders, waitstaff, and door hosts. Track complete payouts.</p>
            </div>
            <button
              onClick={() => setShowShiftForm(true)}
              className="bg-brand-emerald hover:bg-brand-emerald/90 text-brand-dark font-bold px-4 py-2 rounded-lg text-xs tracking-wider flex items-center gap-2 shadow-[0_0_12px_rgba(0,212,165,0.2)]"
            >
              <UserPlus className="w-4 h-4" /> Schedule Shift
            </button>
          </div>

          {/* Add Shift Form Modal */}
          <AnimatePresence>
            {showShiftForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-brand-card border border-brand-card-light rounded-xl p-6 w-full max-w-md shadow-2xl"
                >
                  <h4 className="text-lg font-bold text-white mb-4 font-display">Schedule Staff Shift</h4>
                  <form onSubmit={handleShiftSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-brand-light/60 font-medium mb-1">Select Employee *</label>
                      <select
                        required
                        value={shiftFormData.staffId}
                        onChange={e => setShiftFormData({ ...shiftFormData, staffId: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold"
                      >
                        <option value="">-- Choose Employee --</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role} - KES {s.hourlyRate}/hr)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-brand-light/60 font-medium mb-1">Shift Date *</label>
                      <input
                        type="date"
                        required
                        value={shiftFormData.date}
                        onChange={e => setShiftFormData({ ...shiftFormData, date: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Start Time *</label>
                        <input
                          type="time"
                          required
                          value={shiftFormData.startTime}
                          onChange={e => setShiftFormData({ ...shiftFormData, startTime: e.target.value })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">End Time *</label>
                        <input
                          type="time"
                          required
                          value={shiftFormData.endTime}
                          onChange={e => setShiftFormData({ ...shiftFormData, endTime: e.target.value })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-brand-card-light col-span-full">
                      <button
                        type="button"
                        onClick={() => setShowShiftForm(false)}
                        className="px-4 py-2 rounded bg-brand-card-light hover:bg-brand-card-light/80 text-brand-light"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-brand-emerald text-brand-dark font-bold hover:bg-brand-emerald/90"
                      >
                        Schedule Shift
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Roster Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {shifts.map(shift => {
              const isCompleted = shift.status === 'Completed';
              const isCanceled = shift.status === 'Canceled';
              const isScheduled = shift.status === 'Scheduled';

              return (
                <motion.div
                  key={shift.id}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-brand-card border-brand-emerald/10'
                      : isCanceled
                        ? 'bg-brand-card/30 border-red-500/10 opacity-60'
                        : 'bg-brand-card border-brand-card-light shadow'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-card-light text-brand-light/60">
                        {shift.role}
                      </span>
                      <h5 className="font-bold text-white text-sm mt-1.5 font-display">{shift.staffName}</h5>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      isCompleted 
                        ? 'bg-brand-emerald/15 text-brand-emerald' 
                        : isCanceled 
                          ? 'bg-brand-danger/15 text-brand-danger' 
                          : 'bg-brand-gold/15 text-brand-gold'
                    }`}>
                      {shift.status}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-brand-card-light/50 my-3 pt-3 text-xs space-y-1 text-brand-light/70">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-brand-light/40" />
                      <span>{shift.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-brand-light/40" />
                      <span>{shift.startTime} - {shift.endTime} ({shift.totalHours} hours)</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-brand-gold">
                      <DollarSign className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Est. Payout: {formatKES(shift.payAmount)}</span>
                    </div>
                  </div>

                  {isScheduled && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => {
                          if (confirm(`Accept that ${shift.staffName} has successfully completed this shift? System will automatically log pay wage of ${formatKES(shift.payAmount)} into business payroll expenses.`)) {
                            onUpdateShiftStatus(shift.id, 'Completed');
                          }
                        }}
                        className="py-1.5 rounded bg-brand-emerald/10 hover:bg-brand-emerald hover:text-brand-dark transition-all text-[10px] font-bold text-brand-emerald flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Log Completed
                      </button>
                      <button
                        onClick={() => onUpdateShiftStatus(shift.id, 'Canceled')}
                        className="py-1.5 rounded bg-brand-danger/10 hover:bg-brand-danger hover:text-white transition-all text-[10px] font-bold text-brand-danger flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Cancel Shift
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="text-[10px] text-brand-emerald font-semibold flex items-center gap-1.5 bg-brand-emerald/5 p-2 rounded border border-brand-emerald/10">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Payroll disbursed & added to Overhead expenses.</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Action Row */}
          <div className="bg-brand-card border border-brand-card-light p-4 rounded-xl flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm font-display">Staff Directory</h4>
              <p className="text-xs text-brand-light/50">Register new employees, assign roles, and edit base hourly wage rates.</p>
            </div>
            <button
              onClick={() => setShowStaffForm(true)}
              className="bg-brand-emerald hover:bg-brand-emerald/90 text-brand-dark font-bold px-4 py-2 rounded-lg text-xs tracking-wider flex items-center gap-2 shadow-[0_0_12px_rgba(0,212,165,0.2)]"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>

          {/* Add Staff Form Modal */}
          <AnimatePresence>
            {showStaffForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-brand-card border border-brand-card-light rounded-xl p-6 w-full max-w-md shadow-2xl"
                >
                  <h4 className="text-lg font-bold text-white mb-4 font-display">Register Employee</h4>
                  <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-brand-light/60 font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={staffFormData.name}
                        onChange={e => setStaffFormData({ ...staffFormData, name: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Assigned Role *</label>
                        <select
                          value={staffFormData.role}
                          onChange={e => setStaffFormData({ ...staffFormData, role: e.target.value as any })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold"
                        >
                          <option value="Bartender">Bartender</option>
                          <option value="Manager">Manager</option>
                          <option value="Waiter">Waiter</option>
                          <option value="Security">Security</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Hourly Wage (KES) *</label>
                        <input
                          type="number"
                          required
                          value={staffFormData.hourlyRate}
                          onChange={e => setStaffFormData({ ...staffFormData, hourlyRate: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white text-center font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-brand-light/60 font-medium mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={staffFormData.contact}
                        onChange={e => setStaffFormData({ ...staffFormData, contact: e.target.value })}
                        placeholder="e.g. +254 712 345 678"
                        className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-brand-card-light">
                      <button
                        type="button"
                        onClick={() => setShowStaffForm(false)}
                        className="px-4 py-2 rounded bg-brand-card-light hover:bg-brand-card-light/80 text-brand-light"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-brand-emerald text-brand-dark font-bold hover:bg-brand-emerald/90"
                      >
                        Register
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Staff List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map(member => (
              <div
                key={member.id}
                className="bg-brand-card border border-brand-card-light p-4 rounded-xl flex items-center gap-4 shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald font-bold text-lg">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-white text-sm truncate">{member.name}</h5>
                  <p className="text-xs text-brand-light/50 mt-0.5 font-semibold uppercase tracking-wider">{member.role}</p>
                  <p className="text-[11px] text-brand-light/40 mt-1 truncate">{member.contact}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-brand-light/40 uppercase font-medium">Hourly Rate</p>
                  <p className="text-xs font-bold text-brand-gold mt-0.5">{formatKES(member.hourlyRate)}/hr</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
