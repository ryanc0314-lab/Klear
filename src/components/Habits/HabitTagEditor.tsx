import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface HabitTag {
  id: string;
  name: string;
  color: string;
}

const TAG_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
];

interface HabitTagEditorProps {
  tags: HabitTag[];
  onChange: (tags: HabitTag[]) => void;
  availableTags: HabitTag[]; // All unique tags used elsewhere to quickly select
}

export const HabitTagEditor: React.FC<HabitTagEditorProps> = ({ tags, onChange, availableTags }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    // Avoid duplicates by name
    if (tags.some(t => t.name.toLowerCase() === tagName.trim().toLowerCase())) {
      setTagName('');
      return;
    }

    const newTag: HabitTag = {
      id: uuidv4(),
      name: tagName.trim(),
      color: tagColor
    };

    onChange([...tags, newTag]);
    setTagName('');
    setIsOpen(false);
  };

  const removeTag = (id: string) => {
    onChange(tags.filter(t => t.id !== id));
  };

  const addExisting = (tag: HabitTag) => {
    if (!tags.some(t => t.id === tag.id || t.name === tag.name)) {
      onChange([...tags, tag]);
    }
  };

  // Filter out available tags that are already added
  const unselectedAvailableTags = availableTags.filter(at => !tags.some(t => t.name.toLowerCase() === at.name.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {tags.map(tag => (
          <span key={tag.id} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: `${tag.color}20`, // 20% opacity using hex
            color: tag.color,
            fontSize: '0.75rem',
            fontWeight: 600,
            border: `1px solid ${tag.color}40`
          }}>
            #{tag.name}
            <button type="button" onClick={() => removeTag(tag.id)} style={{ background: 'none', border: 'none', padding: 0, color: tag.color, cursor: 'pointer', display: 'flex' }}>
              <X size={12} />
            </button>
          </span>
        ))}
        {!isOpen && (
          <button type="button" onClick={() => setIsOpen(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)',
            color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer'
          }}>
            <Plus size={12} /> Add Tag
          </button>
        )}
      </div>

      {isOpen && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {unselectedAvailableTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Existing:</span>
              {unselectedAvailableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => addExisting(tag)}
                  style={{
                    padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: `${tag.color}15`,
                    color: tag.color, fontSize: '0.7rem', border: `1px solid ${tag.color}30`, cursor: 'pointer', fontWeight: 600
                  }}
                >
                  +{tag.name}
                </button>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              value={tagName} 
              onChange={e => setTagName(e.target.value)} 
              placeholder="Tag name..."
              style={{ flex: 1, minWidth: '100px', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
            />
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTagColor(color)}
                  style={{
                    width: '18px', height: '18px', borderRadius: '50%', backgroundColor: color,
                    border: color === tagColor ? '2px solid var(--text-primary)' : '2px solid transparent',
                    cursor: 'pointer', padding: 0
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
            <button type="button" onClick={handleAdd} style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>Create</button>
          </div>
        </div>
      )}
    </div>
  );
};
