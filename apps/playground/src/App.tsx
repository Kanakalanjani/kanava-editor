import React from "react";
import { FixedToolbar } from "@kanava/editor-react";
import "@kanava/editor/styles/editor.css";
import "./styles.css";

import { usePlayground } from "./hooks/usePlayground";
import { Header } from "./components/Header";
import { EditorShell } from "./components/EditorShell";
import { PageSetupDialog } from "./components/PageSetupDialog";
import { JsonPanel } from "./components/JsonPanel";
import { StatusBar } from "./components/StatusBar";

export const App: React.FC = () => {
  const {
    editor,
    mode,
    density,
    selectedDemo,
    paginationConfig,
    jsonOutput,
    selectionInfo,
    pageSetupOpen,
    setEditor,
    setMode,
    setDensity,
    selectDemo,
    setPaginationConfig,
    showJSON,
    hideJSON,
    handleSelectionChange,
    handleImageUpload,
    setPageSetupOpen,
  } = usePlayground();

  return (
    <div className="playground">
      <Header
        selectedDemoId={selectedDemo.id}
        mode={mode}
        density={density}
        onSelectDemo={selectDemo}
        onSetMode={setMode}
        onSetDensity={setDensity}
        onPageSetup={() => setPageSetupOpen(true)}
        onViewJSON={showJSON}
      />

      <FixedToolbar editor={editor} />

      <EditorShell
        mode={mode}
        content={selectedDemo.content}
        paginationConfig={paginationConfig}
        editor={editor}
        onEditorRef={setEditor}
        onSelectionChange={handleSelectionChange}
        onImageUpload={handleImageUpload}
      />

      <PageSetupDialog
        open={pageSetupOpen}
        config={paginationConfig}
        onApply={setPaginationConfig}
        onClose={() => setPageSetupOpen(false)}
      />

      <JsonPanel jsonOutput={jsonOutput} onClose={hideJSON} />

      <StatusBar selectionInfo={selectionInfo} />
    </div>
  );
};
