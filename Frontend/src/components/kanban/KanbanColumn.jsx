import React from 'react';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ 
  column, 
  cards, 
  onCardView, 
  onCardEdit, 
  onCardDelete,
  onDrop 
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    onDrop(cardId, column.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={`${column.headerColor} text-white p-3 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{column.title}</h3>
          <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
            {cards.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div 
        className={`${column.color} border-2 border-dashed flex-1 p-3 rounded-b-lg min-h-[500px] space-y-3`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {cards.map(card => (
          <KanbanCard
            key={card.id}
            card={card}
            onView={onCardView}
            onEdit={onCardEdit}
            onDelete={onCardDelete}
          />
        ))}
        
        {cards.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <p className="text-sm">Kéo thả deal vào đây</p>
          </div>
        )}
      </div>
    </div>
  );
}
