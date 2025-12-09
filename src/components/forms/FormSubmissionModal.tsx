'use client';
import { useState, useEffect } from 'react';
import { FormSubmission } from '@/services/formSubmissionService';
import { FaTimes, FaExternalLinkAlt, FaSave } from 'react-icons/fa';
import { MdEmail, MdWeb, MdComputer, MdLocationOn, MdSchedule } from 'react-icons/md';
import { getIPDetails, getIPDetailsSync, formatIPDetails, getCountryFlag, IPDetails } from '@/utils/ipUtils';

interface FormSubmissionModalProps {
  submission: FormSubmission;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<FormSubmission>) => Promise<void>;
  isLoading: boolean;
}

const FormSubmissionModal: React.FC<FormSubmissionModalProps> = ({
  submission,
  isOpen,
  onClose,
  onUpdate,
  isLoading
}) => {
  const [status, setStatus] = useState(submission.status);
  const [notes, setNotes] = useState(submission.notes || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [ipDetails, setIpDetails] = useState<IPDetails | null>(null);
  const [ipLoading, setIpLoading] = useState(false);

  // Track changes
  useEffect(() => {
    const statusChanged = status !== submission.status;
    const notesChanged = notes !== (submission.notes || '');
    setHasChanges(statusChanged || notesChanged);
  }, [status, notes, submission.status, submission.notes]);

  // Load IP details
  useEffect(() => {
    if (!submission.ip_address) {
      setIpDetails(null);
      return;
    }

    // Try to get cached/sync data first
    const syncDetails = getIPDetailsSync(submission.ip_address);
    if (syncDetails) {
      setIpDetails(syncDetails);
      return;
    }

    // If no sync data available, fetch asynchronously
    setIpLoading(true);
    getIPDetails(submission.ip_address)
      .then(details => {
        setIpDetails(details);
        setIpLoading(false);
      })
      .catch(error => {
        console.error('Error loading IP details:', error);
        setIpDetails(null);
        setIpLoading(false);
      });
  }, [submission.ip_address]);

  const handleSave = async () => {
    if (!hasChanges) return;
    
    const updates: Partial<FormSubmission> = {};
    if (status !== submission.status) updates.status = status as FormSubmission['status'];
    if (notes !== (submission.notes || '')) updates.notes = notes;

    await onUpdate(submission.id, updates);
  };


  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'email sent':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Form Submission Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isLoading}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <MdEmail className="w-5 h-5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{submission.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MdWeb className="w-5 h-5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                      <a
                        href={formatUrl(submission.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand-500 hover:text-brand-600 flex items-center"
                      >
                        {submission.website}
                        <FaExternalLinkAlt className="w-3 h-3 ml-2" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Technical Details</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <MdLocationOn className="w-5 h-5 mr-3 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500 dark:text-gray-400">IP Address & Location</p>
                      <p className="font-mono text-sm text-gray-900 dark:text-white mb-1">
                        {submission.ip_address || 'Not recorded'}
                      </p>
                      {submission.ip_address && (
                        ipLoading ? (
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-6 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="flex flex-col space-y-1">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                            </div>
                          </div>
                        ) : ipDetails ? (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-lg">{getCountryFlag(ipDetails.countryCode)}</span>
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {formatIPDetails(ipDetails)}
                              </p>
                              {ipDetails.timezone && !ipDetails.isLocal && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Timezone: {ipDetails.timezone}
                                </p>
                              )}
                              {ipDetails.coordinates && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Coordinates: {ipDetails.coordinates.lat.toFixed(4)}, {ipDetails.coordinates.lng.toFixed(4)}
                                </p>
                              )}
                              {ipDetails.org && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  ISP: {ipDetails.org}
                                </p>
                              )}
                              {ipDetails.postal && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Postal: {ipDetails.postal}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">Location lookup failed</p>
                        )
                      )}
                    </div>
                  </div>
                  
                  {submission.user_agent && (
                    <div className="flex items-start">
                      <MdComputer className="w-5 h-5 mr-3 mt-1 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500 dark:text-gray-400">User Agent</p>
                        <p className="text-sm text-gray-900 dark:text-white break-all">
                          {submission.user_agent}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Status & Timeline */}
            <div className="space-y-4">
              {/* Status Management */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Status Management</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Current Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={isLoading}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="email sent">Email Sent</option>
                      <option value="error">Error</option>
                      <option value="processing">Processing</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                      Original: {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                    {status !== submission.status && (
                      <span className="ml-2 text-sm text-gray-500">
                        → {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Timeline</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <MdSchedule className="w-5 h-5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">
                        {submission.created_at || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MdSchedule className="w-5 h-5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">
                        {submission.updated_at || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {submission.processed_at && (
                    <div className="flex items-center">
                      <MdSchedule className="w-5 h-5 mr-3 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Processed</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {submission.processed_at}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Add notes about this submission..."
            />
          </div>

          {/* ID for reference */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: <span className="font-mono">{submission.id}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-md shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSubmissionModal;