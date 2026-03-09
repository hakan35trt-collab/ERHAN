
import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow, isAfter, subHours } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, User, Clock, Calendar, Eye, EyeOff, Sparkles, AlertCircle, PenLine, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function NoteCard({ note, currentUser, onEdit, onDelete, onMarkAsRead, isSelected, onToggleSelect, canManage, canBulkSelect }) {
  const [isReadByCurrentUser, setIsReadByCurrentUser] = useState(false);
  const [readers, setReaders] = useState(note.readByUsers || []);
  const [loading, setLoading] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  
  // userDisplayRole and canManageNote are no longer needed as per the new permission structure for edit/delete buttons
  // The 'canManage' prop now dictates if individual management actions are available.
  // The 'canBulkSelect' prop, along with 'canManage', dictates if the selection checkbox is available.

  const isNoteNewerThan24h = isAfter(new Date(note.created_date), subHours(new Date(), 24));
  const showNewBadge = isNoteNewerThan24h && !isReadByCurrentUser;

  const isExpired = new Date(note.expires_at) < new Date();

  useEffect(() => {
    setReaders(note.readByUsers || []);
    if (currentUser) {
      setIsReadByCurrentUser(note.readByUsers?.some(user => user.id === currentUser.id) || false);
    }
  }, [note.readByUsers, currentUser]);

  const handleMarkAsRead = async () => {
    setLoading(true);
    try {
      if (onMarkAsRead) {
        await onMarkAsRead(note.id, currentUser.id);
      }
      setIsReadByCurrentUser(true);
    } catch (error) {
      console.error("Not okundu olarak işaretlenemedi:", error);
    }
    setLoading(false);
  };

  const handleCardClick = (e) => {
    // Don't mark as read if clicking checkbox
    if (e.target.closest('.checkbox-wrapper')) {
      return;
    }
    
    if (!currentUser?.id || isReadByCurrentUser || loading || isExpired) return;
    handleMarkAsRead();
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border shadow-lg hover:shadow-yellow-600/20 transition-all duration-300 flex flex-col h-full relative ${
          isSelected ? 'ring-2 ring-yellow-500' : ''
        } ${
          isExpired 
            ? 'border-gray-600 opacity-60 cursor-not-allowed'
            : isReadByCurrentUser 
              ? 'border-yellow-600/30 opacity-80 cursor-default'
              : 'border-yellow-500 shadow-yellow-500/30 ring-1 ring-yellow-500/50 cursor-pointer'
        }`}
      >
        {/* Selection Checkbox - Sadece toplu seçim yetkisi varsa göster */}
        {canBulkSelect && canManage && !isExpired && (
          <div className="checkbox-wrapper absolute top-3 left-3 z-20" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="bg-gray-700 border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
            />
          </div>
        )}

        {isExpired && (
          <div className="absolute -top-2 -left-2 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
              <AlertCircle className="w-3 h-3" />
              SÜRESİ DOLDU
          </div>
        )}

        {showNewBadge && !isExpired && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse z-10">
            <Sparkles className="w-3 h-3" />
            YENİ
          </div>
        )}

        {!isExpired && (
          <div className="absolute top-3 right-3 z-10">
              {isReadByCurrentUser ? (
              <Eye className="w-4 h-4 text-green-400" />
              ) : (
              <EyeOff className="w-4 h-4 text-yellow-400 animate-pulse" />
              )}
          </div>
        )}

        <div className="p-4 flex-grow">
          {note.title && (
            <h3 className={`font-bold mb-2 ${canBulkSelect && canManage ? 'pr-6 pl-8' : 'pr-6'} ${isReadByCurrentUser || isExpired ? 'text-amber-400/70' : 'text-amber-400'}`}>
              {note.title}
            </h3>
          )}
          
          {note.image_url && (
            <div className="mb-3">
              <img 
                src={note.image_url} 
                alt={note.title || "Not resmi"}
                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageViewerOpen(true);
                }}
              />
            </div>
          )}
          
          <p className={`text-sm whitespace-pre-wrap break-words ${canBulkSelect && canManage ? 'pr-6 pl-8' : 'pr-6'} ${isReadByCurrentUser || isExpired ? 'text-yellow-300/70' : 'text-yellow-300'}`}>
            {note.content}
          </p>
        </div>

        {readers.length > 0 && (
          <div className="px-4 pb-3">
            <div className="border-t border-yellow-600/20 pt-2">
              <h4 className="text-xs font-semibold text-amber-500 mb-1.5">Görenler ({readers.length})</h4>
              <div className="flex items-center space-x-[-8px]">
                <TooltipProvider>
                  {readers.slice(0, 5).map(user => (
                    <Tooltip key={user.id}>
                      <TooltipTrigger asChild>
                        <Avatar className="w-6 h-6 border-2 border-gray-900">
                          <AvatarImage src={user.profile_picture_url} alt={user.first_name} />
                          <AvatarFallback className="text-xs bg-amber-800 text-amber-300">
                            {user.first_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black text-amber-400 border-amber-600">
                        <p>{user.first_name} {user.last_name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {readers.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900">
                      +{readers.length - 5}
                    </div>
                  )}
                </TooltipProvider>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-3 bg-black/20 rounded-b-xl border-t border-yellow-600/20 mt-auto">
          <div className="flex justify-between items-end">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span className={`text-xs ${isReadByCurrentUser || isExpired ? 'text-amber-600/70' : 'text-amber-600'}`}>
                  {note.created_by_name}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span className={`text-xs ${isReadByCurrentUser || isExpired ? 'text-amber-600/70' : 'text-amber-600'}`}>
                  Oluşturma: {format(new Date(note.created_date), 'dd.MM.yy HH:mm', { locale: tr })}
                </span>
              </div>

              {note.updated_date && new Date(note.updated_date) > new Date(note.created_date).setSeconds(new Date(note.created_date).getSeconds() + 10) && (
                <div className="flex items-center space-x-1">
                  <PenLine className="w-3 h-3" />
                  <span className={`text-xs ${isReadByCurrentUser || isExpired ? 'text-amber-600/70' : 'text-amber-600'}`}>
                    Düzenleme: {format(new Date(note.updated_date), 'dd.MM.yy HH:mm', { locale: tr })}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span className={`text-xs ${isReadByCurrentUser || isExpired ? 'text-amber-600/70' : 'text-amber-600'}`}>
                  Bitiş: {formatDistanceToNow(new Date(note.expires_at), { addSuffix: true, locale: tr })}
                </span>
              </div>
            </div>
            
            {canManage && (
              <div className="flex space-x-1 ml-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-7 h-7 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  disabled={isExpired}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-7 h-7 text-red-400 hover:bg-red-900/50 hover:text-red-300" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="bg-black border-none max-w-full max-h-full p-0 m-0 w-screen h-screen">
          <div className="absolute top-4 right-4 z-50">
            <Button
              onClick={() => setIsImageViewerOpen(false)}
              variant="outline"
              className="border-red-600 text-red-400 bg-black/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center w-full h-full">
            <img
              src={note.image_url}
              alt={note.title || "Not resmi"}
              className="object-contain w-full h-full"
              style={{ maxWidth: 'none', maxHeight: 'none' }}
            />
          </div>
          
          {note.title && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 p-4 rounded-lg">
              <p className="text-yellow-300 text-center font-semibold">{note.title}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
