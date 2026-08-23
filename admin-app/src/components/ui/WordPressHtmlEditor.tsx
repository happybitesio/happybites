import { useEffect, useId, useRef } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  height?: number;
}

function readEditorContent(editorId: string): string {
  const tinymce = window.tinymce?.get(editorId);
  if (tinymce && !tinymce.isHidden()) {
    return tinymce.getContent();
  }

  const textarea = document.getElementById(editorId) as HTMLTextAreaElement | null;
  return textarea?.value ?? '';
}

export function WordPressHtmlEditor({ value, onChange, height = 300 }: Props) {
  const reactId = useId().replace(/:/g, '');
  const editorId = `hb-html-editor-${reactId}`;
  const onChangeRef = useRef(onChange);
  const initializedRef = useRef(false);

  onChangeRef.current = onChange;

  useEffect(() => {
    const textarea = document.getElementById(editorId) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const emitChange = () => {
      onChangeRef.current(readEditorContent(editorId));
    };

    const initEditor = () => {
      if (initializedRef.current || !window.wp?.editor) {
        return Boolean(initializedRef.current);
      }

      window.wp.editor.initialize(editorId, {
        tinymce: {
          wpautop: true,
          toolbar1:
            'formatselect,bold,italic,underline,strikethrough,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,undo,redo',
          toolbar2: '',
          height,
        },
        quicktags: true,
        mediaButtons: true,
      });

      initializedRef.current = true;

      const tinymce = window.tinymce?.get(editorId);
      if (tinymce) {
        tinymce.on('change keyup undo redo SetContent', emitChange);
      }

      textarea.addEventListener('input', emitChange);
      return true;
    };

    let interval: ReturnType<typeof setInterval> | undefined;

    if (!initEditor()) {
      interval = setInterval(() => {
        if (initEditor()) {
          clearInterval(interval);
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
      emitChange();
      if (initializedRef.current) {
        window.wp?.editor?.remove(editorId);
        initializedRef.current = false;
      }
      textarea.removeEventListener('input', emitChange);
    };
  }, [editorId, height]);

  return (
    <div className="hb-html-editor">
      <textarea id={editorId} defaultValue={value} className="hb-html-editor__textarea" rows={12} />
    </div>
  );
}
