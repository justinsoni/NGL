import React, { useState } from 'react';
import { Club } from '../types';

interface ClubListProps {
  clubs: Club[];
  onEdit?: (club: Club) => void;
  onDelete?: (clubId: string | number) => void;
  onView?: (club: Club) => void;
  isLoading?: boolean;
}

const ClubList: React.FC<ClubListProps> = ({
  clubs,
  onEdit,
  onDelete,
  onView,
  isLoading = false
}) => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const handleViewDetails = (club: Club) => {
    setSelectedClub(club);
    if (onView) {
      onView(club);
    }
  };

  const closeModal = () => {
    setSelectedClub(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
        <span className="ml-2 text-theme-text-secondary">Loading clubs...</span>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-theme-text-secondary">No clubs found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
          >
            {/* Club Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img
                  src={club.logo}
                  alt={`${club.name} logo`}
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/48x48?text=Club';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-theme-dark">{club.name}</h3>
                  <p className="text-sm text-gray-600">
                    {club.city && club.country ? `${club.city}, ${club.country}` : 'Location not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Club Details */}
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stadium:</span>
                <span className="font-medium">{club.stadium || 'Not specified'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Founded:</span>
                <span className="font-medium">{club.founded || 'Unknown'}</span>
              </div>
              
              {club.stadiumCapacity && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{club.stadiumCapacity.toLocaleString()}</span>
                </div>
              )}
              


              {club.honours && club.honours.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">Honours:</span>
                  <div className="mt-1 space-y-1">
                    {club.honours.slice(0, 2).map((honour, index) => (
                      <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {honour.name}: {honour.count}
                      </div>
                    ))}
                    {club.honours.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{club.honours.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => handleViewDetails(club)}
                className="text-theme-primary hover:text-theme-primary/80 text-sm font-medium"
              >
                View Details
              </button>
              
              <div className="space-x-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(club)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={() => onDelete(club.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Club Details Modal */}
      {selectedClub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-theme-dark">Club Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedClub.logo}
                    alt={`${selectedClub.name} logo`}
                    className="h-16 w-16 object-contain"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{selectedClub.name}</h3>
                    <p className="text-gray-600">
                      {selectedClub.city && selectedClub.country 
                        ? `${selectedClub.city}, ${selectedClub.country}` 
                        : 'Location not specified'}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Stadium Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Stadium:</span> {selectedClub.stadium || 'Not specified'}</p>
                      {selectedClub.stadiumCapacity && (
                        <p><span className="font-medium">Capacity:</span> {selectedClub.stadiumCapacity.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Club Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Founded:</span> {selectedClub.founded || 'Unknown'}</p>
                      {selectedClub.colors?.primary && (
                        <p><span className="font-medium">Colors:</span> {selectedClub.colors.primary}
                          {selectedClub.colors.secondary && ` / ${selectedClub.colors.secondary}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                {(selectedClub.website || selectedClub.email || selectedClub.phone) && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Contact Information</h4>
                    <div className="space-y-1 text-sm">
                      {selectedClub.website && (
                        <p>
                          <span className="font-medium">Website:</span>{' '}
                          <a href={selectedClub.website} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:underline">
                            {selectedClub.website}
                          </a>
                        </p>
                      )}
                      {selectedClub.email && (
                        <p><span className="font-medium">Email:</span> {selectedClub.email}</p>
                      )}
                      {selectedClub.phone && (
                        <p><span className="font-medium">Phone:</span> {selectedClub.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Honours */}
                {selectedClub.honours && selectedClub.honours.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Honours</h4>
                    <div className="space-y-2">
                      {selectedClub.honours.map((honour, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{honour.name}</span>
                            <span className="text-theme-primary font-bold">{honour.count}</span>
                          </div>
                          {honour.years && honour.years.length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              Years: {honour.years.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedClub.description && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedClub.description}</p>
                  </div>
                )}

                {/* Social Media */}
                {selectedClub.socialMedia && Object.values(selectedClub.socialMedia).some(url => url) && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Social Media</h4>
                    <div className="flex space-x-4">
                      {selectedClub.socialMedia.twitter && (
                        <a href={selectedClub.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                           className="text-blue-400 hover:text-blue-600">Twitter</a>
                      )}
                      {selectedClub.socialMedia.facebook && (
                        <a href={selectedClub.socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                           className="text-blue-600 hover:text-blue-800">Facebook</a>
                      )}
                      {selectedClub.socialMedia.instagram && (
                        <a href={selectedClub.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                           className="text-pink-600 hover:text-pink-800">Instagram</a>
                      )}
                      {selectedClub.socialMedia.youtube && (
                        <a href={selectedClub.socialMedia.youtube} target="_blank" rel="noopener noreferrer"
                           className="text-red-600 hover:text-red-800">YouTube</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClubList;
