import { useEffect, useState, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { Plus, Trash2, Pencil, Check, Search, FileText, Tag as TagIcon, XCircle, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css';
import TurndownService from 'turndown';

export const NotesDashboard = () => {
  const { notes, loadNotes, addNote, updateNote, deleteNote } = useNoteStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTagsStr, setEditTagsStr] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const [managingTags, setManagingTags] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedTag !== 'All') {
      result = result.filter(n => n.tags?.includes(selectedTag));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [notes, searchQuery, selectedTag]);

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    if (!newTag.trim() || oldTag === newTag) return;
    const mergedTag = newTag.trim();
    
    // Find all notes with the old tag
    const notesToUpdate = notes.filter(n => n.tags?.includes(oldTag));
    for (const note of notesToUpdate) {
      // Create new tag array mapping the old to the new, removing duplicates
      const newTags = Array.from(new Set(note.tags!.map(t => t === oldTag ? mergedTag : t)));
      await updateNote(note.id, { tags: newTags });
    }
    
    setTagToEdit(null);
    setNewTagName('');
  };

  const handleCreate = async () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    
    const tags = newTagsStr.split(',').map(t => t.trim()).filter(Boolean);
    
    await addNote(newTitle.trim() || 'Untitled Note', newContent, tags.length > 0 ? tags : undefined);
    
    setIsCreating(false);
    setNewTitle('');
    setNewContent('');
    setNewTagsStr('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setContent: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setContent((prev) => prev + `\n\n![Image](${dataUrl})\n`);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so the same file can be selected again
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, setContent: React.Dispatch<React.SetStateAction<string>>) => {
    const htmlData = e.clipboardData.getData('text/html');
    if (htmlData) {
      e.preventDefault();
      try {
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
        });
        const markdown = turndownService.turndown(htmlData);
        
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const currentValue = target.value;
        const newValue = currentValue.substring(0, start) + markdown + currentValue.substring(end);
        
        setContent(newValue);
        
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + markdown.length;
        }, 0);
      } catch (err) {
        console.error("Paste conversion failed:", err);
      }
    }
  };

  const startEditing = (note: any) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTagsStr(note.tags?.join(', ') || '');
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editTitle.trim() && !editContent.trim()) {
       setEditingId(null);
       return;
    }
    
    const tags = editTagsStr.split(',').map(t => t.trim()).filter(Boolean);
    
    await updateNote(editingId, {
      title: editTitle.trim() || 'Untitled Note',
      content: editContent,
      tags: tags.length > 0 ? tags : undefined
    });
    
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteNote(id);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Notes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Store your miscellaneous notes, passwords, and ideas securely.</p>
        </div>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Note
          </button>
        )}
      </div>

      <div className="animated-card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TagIcon size={16} color="var(--text-secondary)" />
          <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}>
            <option value="All">All Tags</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <button 
            onClick={() => setManagingTags(!managingTags)} 
            className="btn btn-secondary" 
            style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}
            title="Manage Tags"
          >
            <Pencil size={16} /> Manage
          </button>
        </div>
      </div>

      {managingTags && (
        <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Manage Tags</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {allTags.map(tag => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-sidebar)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                 {tagToEdit === tag ? (
                   <>
                     <input 
                       value={newTagName} 
                       onChange={(e) => setNewTagName(e.target.value)} 
                       style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', width: '120px' }}
                       autoFocus
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') handleRenameTag(tag, newTagName);
                         if (e.key === 'Escape') setTagToEdit(null);
                       }}
                     />
                     <button onClick={() => handleRenameTag(tag, newTagName)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', padding: 0 }}><Check size={16}/></button>
                     <button onClick={() => setTagToEdit(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}><XCircle size={16}/></button>
                   </>
                 ) : (
                   <>
                     <span style={{ fontSize: '0.9rem' }}>{tag}</span>
                     <button 
                       onClick={() => { setTagToEdit(tag); setNewTagName(tag); }}
                       style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                       onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                       onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                     >
                       <Pencil size={14}/>
                     </button>
                   </>
                 )}
              </div>
            ))}
            {allTags.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tags found.</span>}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Renaming a tag to match another will merge them across all notes.
          </p>
        </div>
      )}

      {isCreating && (
        <div className="animated-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Note Title" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ fontSize: '1.25rem', fontWeight: 600, padding: '0.5rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', flex: 1 }}
              autoFocus
            />
            <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><XCircle size={24} /></button>
          </div>
          
          <textarea 
            placeholder="Write your note here..." 
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onPaste={(e) => handlePaste(e, setNewContent)}
            rows={8}
            style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
          />
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="file" 
              id="new-note-image" 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, setNewContent)} 
            />
            <label htmlFor="new-note-image" className="btn btn-secondary" style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <ImageIcon size={18} /> Image
            </label>
            <input 
              type="text" 
              placeholder="Tags (comma separated, e.g. password, ideas, work)" 
              value={newTagsStr}
              onChange={(e) => setNewTagsStr(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
            />
            <button onClick={handleCreate} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Save Note</button>
          </div>
        </div>
      )}

      {notes.length === 0 && !isCreating ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No notes found. Create your first note!</p>
        </div>
      ) : filteredNotes.length === 0 && !isCreating ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
           <p>No notes match your search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredNotes.map(note => (
            editingId === note.id ? (
              <div key={note.id} className="animated-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ fontSize: '1.25rem', fontWeight: 600, padding: '0.25rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', flex: 1, borderBottom: '1px solid var(--border-color)' }}
                  />
                </div>
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onPaste={(e) => handlePaste(e, setEditContent)}
                  rows={6}
                  autoFocus
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                />
                <input 
                  type="text" 
                  placeholder="Tags (comma separated)" 
                  value={editTagsStr}
                  onChange={(e) => setEditTagsStr(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <input 
                       type="file" 
                       id={`edit-note-image-${note.id}`} 
                       style={{ display: 'none' }} 
                       accept="image/*" 
                       onChange={(e) => handleImageUpload(e, setEditContent)} 
                     />
                     <label htmlFor={`edit-note-image-${note.id}`} className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                       <ImageIcon size={16} /> Image
                     </label>
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button onClick={() => setEditingId(null)} className="btn">Cancel</button>
                     <button onClick={handleUpdate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Check size={16} /> Save</button>
                   </div>
                </div>
              </div>
            ) : (
              <div 
                key={note.id} 
                className="animated-card note-card" 
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer', position: 'relative' }}
                onClick={() => startEditing(note)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{note.title}</h3>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEditing(note); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Edit Note"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(note.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--accent-danger)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Delete Note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.5,
                  overflow: expandedIds.includes(note.id) ? 'visible' : 'hidden',
                  display: expandedIds.includes(note.id) ? 'block' : '-webkit-box',
                  WebkitLineClamp: expandedIds.includes(note.id) ? 'unset' : 5,
                  WebkitBoxOrient: 'vertical',
                  margin: 0,
                  flex: 1
                }} className="note-markdown">
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>
                    {note.content}
                  </ReactMarkdown>
                </div>
                {(note.content.length > 150 || note.content.split('\n').length > 5) && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedIds(prev => prev.includes(note.id) ? prev.filter(i => i !== note.id) : [...prev, note.id]);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.8rem', padding: '0.25rem 0', alignSelf: 'flex-start', fontWeight: 500, marginTop: '-0.5rem' }}
                  >
                    {expandedIds.includes(note.id) ? 'Show less' : 'Show more'}
                  </button>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {note.tags && note.tags.length > 0 ? note.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-secondary)' }}>
                        {tag}
                      </span>
                    )) : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No tags</span>}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {format(new Date(note.updated_at || note.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};
