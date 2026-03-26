import React, { useRef, useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';

export interface CodeEditorRef {
  execCommand: (cmd: string) => void;
  insertText: (text: string) => void;
}

interface Props {
  content: string;
  language: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const EDITOR_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #0a0a0a; overflow: hidden; }
    #container { display: flex; width: 100%; height: 100%; }
    #line-numbers {
      position: relative; overflow: hidden;
      min-width: 40px; padding: 8px 8px 8px 8px;
      background: #0f0f0f; color: #555; font: 13px/1.5 'Menlo', 'Monaco', 'Courier New', monospace;
      text-align: right; user-select: none; border-right: 1px solid #1a1a1a;
    }
    #line-numbers .inner { position: relative; }
    #editor {
      flex: 1; padding: 8px; border: none; resize: none; outline: none;
      background: #0a0a0a; color: #e0e0e0; font: 13px/1.5 'Menlo', 'Monaco', 'Courier New', monospace;
      white-space: pre; overflow: auto; tab-size: 2;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="line-numbers"><div class="inner" id="lines"></div></div>
    <textarea id="editor" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
  </div>
  <script>
    const editor = document.getElementById('editor');
    const lines = document.getElementById('lines');

    function updateLines() {
      const count = editor.value.split('\\n').length;
      lines.innerHTML = Array.from({ length: count }, (_, i) => i + 1).join('<br>');
    }

    editor.addEventListener('input', () => {
      updateLines();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'change', content: editor.value }));
    });

    editor.addEventListener('scroll', () => {
      lines.style.top = -editor.scrollTop + 'px';
    });

    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
        editor.dispatchEvent(new Event('input'));
      }
    });

    window.setContent = (text, readOnly) => {
      editor.value = text;
      editor.readOnly = !!readOnly;
      updateLines();
    };

    window.getContent = () => editor.value;

    window.execCommand = (cmd) => {
      editor.focus();
      if (cmd === 'selectAll') {
        editor.selectionStart = 0;
        editor.selectionEnd = editor.value.length;
      } else if (cmd === 'copy') {
        document.execCommand('copy');
      } else if (cmd === 'cut') {
        document.execCommand('cut');
        editor.dispatchEvent(new Event('input'));
      } else if (cmd === 'paste') {
        navigator.clipboard.readText().then(t => {
          const s = editor.selectionStart, e = editor.selectionEnd;
          editor.value = editor.value.substring(0, s) + t + editor.value.substring(e);
          editor.selectionStart = editor.selectionEnd = s + t.length;
          editor.dispatchEvent(new Event('input'));
        }).catch(() => {});
      } else if (cmd === 'undo') {
        document.execCommand('undo');
        editor.dispatchEvent(new Event('input'));
      } else if (cmd === 'redo') {
        document.execCommand('redo');
        editor.dispatchEvent(new Event('input'));
      } else if (cmd === 'newline') {
        const s = editor.selectionStart, e = editor.selectionEnd;
        editor.value = editor.value.substring(0, s) + '\\n' + editor.value.substring(e);
        editor.selectionStart = editor.selectionEnd = s + 1;
        editor.dispatchEvent(new Event('input'));
      }
    };

    window.insertText = (text) => {
      editor.focus();
      const s = editor.selectionStart, e = editor.selectionEnd;
      editor.value = editor.value.substring(0, s) + text + editor.value.substring(e);
      editor.selectionStart = editor.selectionEnd = s + text.length;
      editor.dispatchEvent(new Event('input'));
    };

    updateLines();
  <\/script>
</body>
</html>
`;

// Web version: use iframe
function WebCodeEditor({ content, language, onChange, readOnly }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'change') {
          onChange(msg.content);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onChange]);

  // Update content when props change after initial load
  const lastSentContent = useRef(content);
  useEffect(() => {
    if (loaded.current && iframeRef.current?.contentWindow && content !== lastSentContent.current) {
      lastSentContent.current = content;
      const escaped = JSON.stringify(content);
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ type: 'setContent', text: escaped, readOnly: readOnly || false }),
        '*',
      );
      try {
        (iframeRef.current.contentWindow as any)?.setContent?.(content, readOnly || false);
      } catch {}
    }
  }, [content, readOnly]);

  // Patch the HTML to use parent.postMessage instead of ReactNativeWebView
  const webHtml = EDITOR_HTML.replace(
    /window\.ReactNativeWebView\.postMessage/g,
    'window.parent.postMessage'
  );

  return (
    <iframe
      ref={iframeRef as any}
      srcDoc={webHtml}
      style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#0a0a0a' } as any}
      onLoad={() => {
        if (!loaded.current) {
          loaded.current = true;
          const escaped = JSON.stringify(content);
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ type: 'setContent', text: escaped, readOnly: readOnly || false }),
            '*',
          );
          // Direct eval as fallback
          try {
            (iframeRef.current?.contentWindow as any)?.setContent?.(content, readOnly || false);
          } catch {}
        }
      }}
    />
  );
}

// Native version: use react-native-webview
const NativeCodeEditor = forwardRef<CodeEditorRef, Props>(function NativeCodeEditor({ content, language, onChange, readOnly }, ref) {
  const [WebViewModule, setWebViewModule] = useState<any>(null);
  useEffect(() => {
    import('react-native-webview').then((mod) => setWebViewModule(mod));
  }, []);

  const WebView = WebViewModule?.default;
  const webViewRef = useRef<any>(null);
  const loadedRef = useRef(false);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'change') {
          onChange(msg.content);
        }
      } catch {}
    },
    [onChange],
  );

  useImperativeHandle(ref, () => ({
    execCommand: (cmd: string) => {
      webViewRef.current?.injectJavaScript(`window.execCommand('${cmd}'); true;`);
    },
    insertText: (text: string) => {
      const escaped = JSON.stringify(text);
      webViewRef.current?.injectJavaScript(`window.insertText(${escaped}); true;`);
    },
  }));

  const onLoad = useCallback(() => {
    loadedRef.current = true;
    const escaped = JSON.stringify(content);
    webViewRef.current?.injectJavaScript(
      `window.setContent(${escaped}, ${readOnly || false}); true;`
    );
  }, [content, readOnly]);

  // Update content when props change after initial load
  const lastSentContent = useRef(content);
  useEffect(() => {
    if (loadedRef.current && webViewRef.current && content !== lastSentContent.current) {
      lastSentContent.current = content;
      const escaped = JSON.stringify(content);
      webViewRef.current.injectJavaScript(
        `window.setContent(${escaped}, ${readOnly || false}); true;`
      );
    }
  }, [content, readOnly]);

  if (!WebView) {
    return <View style={styles.editor}><Text style={{ color: '#888', padding: 20 }}>Laden...</Text></View>;
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ html: EDITOR_HTML }}
      style={styles.editor}
      javaScriptEnabled
      onMessage={handleMessage}
      onLoad={onLoad}
      scrollEnabled={false}
      bounces={false}
      keyboardDisplayRequiresUserAction={false}
    />
  );
});

const CodeEditor = forwardRef<CodeEditorRef, Props>(function CodeEditor(props, ref) {
  if (Platform.OS === 'web') return <WebCodeEditor {...props} />;
  return <NativeCodeEditor ref={ref} {...props} />;
});

export default CodeEditor;

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
