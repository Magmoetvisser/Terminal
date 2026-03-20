import React, { useRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

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
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #0a0a0a; }
    #editor {
      width: 100%;
      height: 100%;
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      padding: 12px;
      border: none;
      outline: none;
      resize: none;
      white-space: pre;
      overflow: auto;
      tab-size: 2;
      -webkit-text-size-adjust: none;
    }
    .line-numbers {
      position: absolute;
      left: 0;
      top: 0;
      width: 40px;
      height: 100%;
      background: #111;
      color: #444;
      font-family: monospace;
      font-size: 13px;
      line-height: 1.6;
      padding: 12px 4px;
      text-align: right;
      user-select: none;
      pointer-events: none;
      overflow: hidden;
    }
    .with-lines #editor { padding-left: 48px; }
  </style>
</head>
<body class="with-lines">
  <div class="line-numbers" id="lines"></div>
  <textarea id="editor" spellcheck="false"></textarea>
  <script>
    const editor = document.getElementById('editor');
    const lines = document.getElementById('lines');
    let debounce;

    function updateLines() {
      const count = editor.value.split('\\n').length;
      lines.innerHTML = Array.from({length: count}, (_, i) => i + 1).join('<br>');
    }

    editor.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'change',
          content: editor.value,
        }));
      }, 300);
      updateLines();
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

    updateLines();
  </script>
</body>
</html>
`;

export default function CodeEditor({ content, language, onChange, readOnly }: Props) {
  const webViewRef = useRef<WebView>(null);
  const loaded = useRef(false);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'change') {
          onChange(msg.content);
        }
      } catch {}
    },
    [onChange],
  );

  const onLoad = useCallback(() => {
    loaded.current = true;
    const escaped = JSON.stringify(content);
    webViewRef.current?.injectJavaScript(
      `window.setContent(${escaped}, ${readOnly || false}); true;`
    );
  }, [content, readOnly]);

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
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
