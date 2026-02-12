import React, { useRef, useState, useEffect, useCallback } from "react";

// ICONS (assuming these paths are correct)
import boldIcon from "./svg/bold.svg";
import italicIcon from "./svg/italic.svg";
import strikethroughIcon from "./svg/strikethrough.svg";
import headingIcon from "./svg/heading.svg";
import quoteIcon from "./svg/quote.svg";
import codeIcon from "./svg/code.svg";
import bulletsIcon from "./svg/bullets.svg";
import numbersIcon from "./svg/numbers.svg";
import decreaseLevelIcon from "./svg/decrease-level.svg";
import increaseLevelIcon from "./svg/increase-level.svg";

interface TextStyle {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
}

// Define a type for active block types
type ActiveBlockType =
  | "p"
  | "h1"
  | "blockquote"
  | "pre"
  | "ul"
  | "ol"
  | null;

// Define props for the TextArea component
interface TextAreaProps {
  value: string; // The HTML content from React Hook Form
  onChange: (html: string) => void; // Callback to update form state
  onBlur: () => void; // Callback for blur event
}

export const TextArea = ({ value, onChange, onBlur }: TextAreaProps): JSX.Element => {
  const [textStyle, setTextStyle] = useState<TextStyle>({
    bold: false,
    italic: false,
    strikethrough: false,
  });
  const [activeBlockType, setActiveBlockType] =
    useState<ActiveBlockType>("p");

  const editorRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false); // To track if component is mounted
  // Renamed to better reflect purpose: syncNeeded means the prop value
  // needs to be written to the DOM, potentially overwriting user input
  const syncNeeded = useRef(false); // Flag to indicate if DOM sync is needed

  const updateToolbarState = useCallback(() => {
    if (!editorRef.current) return;

    setTextStyle({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      strikethrough: document.queryCommandState("strikethrough"),
    });

    let node = window.getSelection()?.anchorNode;
    if (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      let blockType: ActiveBlockType = null;
      while (node && node !== editorRef.current) {
        const tagName = node.nodeName.toLowerCase();
        if (
          ["p", "h1", "blockquote", "pre", "ul", "ol", "li"].includes(tagName)
        ) {
          if (tagName === "li" && node.parentNode) {
            blockType = node.parentNode.nodeName.toLowerCase() as ActiveBlockType; // ul or ol
          } else {
            blockType = tagName as ActiveBlockType;
          }
          break;
        }
        node = node.parentNode;
      }
      setActiveBlockType(blockType || "p");
    }
  }, []);

  // Effect for initial setup and external value changes
  useEffect(() => {
    isMounted.current = true;
    document.execCommand("defaultParagraphSeparator", false, "p");

    const editorNode = editorRef.current;
    if (editorNode) {
     
      if (value !== editorNode.innerHTML && !syncNeeded.current) {
          
           editorNode.innerHTML = value || "<p><br></p>"; // Use value or default empty paragraph
           // After setting, ensure the toolbar reflects the new state
           updateToolbarState();
      }


      
      document.addEventListener("selectionchange", updateToolbarState);
      editorNode.addEventListener("focus", updateToolbarState); // Update on focus
      editorNode.addEventListener("click", updateToolbarState); // Update on click
      editorNode.addEventListener("keyup", updateToolbarState); // Update on keyup
      editorNode.addEventListener("blur", onBlur); // Notify RHF on blur (using the prop)


      // Initial toolbar state update
      updateToolbarState();

      return () => {
        isMounted.current = false;
        document.removeEventListener("selectionchange", updateToolbarState);
        editorNode.removeEventListener("focus", updateToolbarState);
        editorNode.removeEventListener("click", updateToolbarState);
        editorNode.removeEventListener("keyup", updateToolbarState);
        editorNode.removeEventListener("blur", onBlur);
      };
    }
  }, [value, onBlur, updateToolbarState]); // Depend on value, onBlur, and updateToolbarState

  // Function to handle input changes and call RHF's onChange
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      syncNeeded.current = true; // Indicate that user is typing/formatting, prevent external sync temporarily

      
      let currentHTML = target.innerHTML;
     
      if (!target.textContent?.trim() && !target.querySelector('img') && !target.querySelector('br')) { // Check for empty content
         
          if(isMounted.current) { // Ensure component is mounted before setting innerHTML
            target.innerHTML = "<p><br></p>";
          
            const selection = window.getSelection();
            const range = document.createRange();
            if (target.firstChild && target.firstChild.firstChild) {
              range.setStart(target.firstChild, 0);
              range.collapse(true);
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
             
             currentHTML = target.innerHTML; // Update currentHTML after reset
           
             onChange(currentHTML); // Send the reset value to RHF
             updateToolbarState(); // Update toolbar
            
             return; // Exit the function after handling empty state
          }
      }

     
      onChange(currentHTML);

      
      updateToolbarState();

     
  };

   
   const handleBlur = () => {
       
       syncNeeded.current = false;
       onBlur(); 
   }


  const handleFormat = (format: keyof TextStyle) => {
    editorRef.current?.focus();
    syncNeeded.current = true; 
    document.execCommand(format, false);
    updateToolbarState();
   
  };

  const handleStructure = (command: string, value?: string) => {
    editorRef.current?.focus();
    syncNeeded.current = true; 
  
    document.execCommand(command, false, value ? `<${value}>` : "p"); // Default to 'p' if no value


    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    let block = range?.commonAncestorContainer;

    if (block) {
        while (
            block &&
            block.nodeType === Node.TEXT_NODE &&
            block.parentNode !== editorRef.current
        ) {
            block = block.parentNode;
        }
        if (block === editorRef.current && editorRef.current.firstChild && editorRef.current.firstChild.nodeType !== Node.TEXT_NODE) {
            block = editorRef.current.firstChild as HTMLElement;
        }

        if (block && block !== editorRef.current && (block as HTMLElement).style) {
            const element = block as HTMLElement;
            element.style.fontSize = "";
            element.style.fontWeight = "";
            element.style.margin = "8px 0";
            element.style.color = "#000000";
            element.style.lineHeight = "24px";
            element.style.borderLeft = "";
            element.style.paddingLeft = "";
            element.style.fontStyle = "";
            element.style.backgroundColor = "";
            element.style.padding = "";
            element.style.borderRadius = "";
            element.style.fontFamily = "";

            switch (value) {
                case "h1":
                    element.style.fontSize = "20px";
                    element.style.fontWeight = "600";
                    element.style.lineHeight = "28px";
                    break;
                case "blockquote":
                    element.style.borderLeft = "2px solid #CBD5E1";
                    element.style.paddingLeft = "16px";
                    element.style.color = "#64748B";
                    element.style.fontStyle = "italic";
                    break;
                case "pre":
                    element.style.backgroundColor = "#F1F5F9";
                    element.style.padding = "16px";
                    element.style.borderRadius = "6px";
                    element.style.fontFamily = "monospace";
                    element.style.fontSize = "14px";
                    element.style.lineHeight = "20px";
                    break;
                case "p":
                    break;
            }
        }
    } else if (
        command === "insertUnorderedList" ||
        command === "insertOrderedList"
    ) {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);

        if (range && range.collapsed) {
            const currentBlock = range.startContainer.parentElement;
            if (currentBlock === editorRef.current) {
                document.execCommand("formatBlock", false, "p");
            }
        }

        document.execCommand(command, false);

        // Style the list... (keep this as is)
        let listElement = range?.commonAncestorContainer;
        if (listElement) {
            if (listElement.nodeType === Node.TEXT_NODE) listElement = listElement.parentNode;
            while (listElement && listElement !== editorRef.current && listElement.nodeName !== 'UL' && listElement.nodeName !== 'OL') {
                listElement = listElement.parentNode;
            }
            if (listElement && (listElement.nodeName === 'UL' || listElement.nodeName === 'OL')) {
                const list = listElement as HTMLElement;
                list.style.margin = "8px 0";
                list.style.paddingLeft = "24px";
                list.style.color = "#000000";
                list.style.lineHeight = "24px";

                const items = list.getElementsByTagName("li");
                for (let i = 0; i < items.length; i++) {
                    const item = items[i] as HTMLLIElement;
                    item.style.margin = "4px 0";
                    item.style.fontFamily = "";
                    item.style.fontStyle = "";
                    item.style.backgroundColor = "";
                    item.style.borderLeft = "";
                    item.style.padding = "";
                }
            }
        }
    } else {
        document.execCommand(command, false);
    }
  
    updateToolbarState(); 
 
  };


  const formattingButtons = [
    { icon: boldIcon, alt: "Bold", command: "bold" as keyof TextStyle },
    { icon: italicIcon, alt: "Italic", command: "italic" as keyof TextStyle },
    {
      icon: strikethroughIcon,
      alt: "Strikethrough",
      command: "strikethrough" as keyof TextStyle,
    },
  ];

  const structureButtons = [
    { icon: headingIcon, alt: "Heading", command: "formatBlock", value: "h1" },
    {
      icon: quoteIcon,
      alt: "Quote",
      command: "formatBlock",
      value: "blockquote",
    },
    { icon: codeIcon, alt: "Code", command: "formatBlock", value: "pre" },
    { icon: bulletsIcon, alt: "Bullets", command: "insertUnorderedList", value: "ul" },
    { icon: numbersIcon, alt: "Numbers", command: "insertOrderedList", value: "ol" },
    { icon: decreaseLevelIcon, alt: "Decrease level", command: "outdent" },
    { icon: increaseLevelIcon, alt: "Increase level", command: "indent" },
  ];

  return (
    <main className="relative w-full bg-white">
      <div className="w-full ">
        <section className="max-w-[1200px] space-y-3 py-6">
          <div className="flex gap-2 flex-wrap">
     
            <div className="flex bg-white border border-gray-200 rounded-md overflow-hidden">
              {formattingButtons.map((button, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleFormat(button.command)}
                  className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors ${
                    textStyle[button.command]
                      ? "bg-gray-200"
                      : "hover:bg-gray-100"
                  } ${
                    index < formattingButtons.length - 1
                      ? "border-r border-gray-200"
                      : ""
                  }`}
                  aria-label={button.alt}
                  aria-pressed={textStyle[button.command]}
                >
                  <img
                    className="w-5 h-5"
                    alt={button.alt}
                    src={button.icon}
                  />
                </button>
              ))}
            </div>

            {/* Structure Buttons */}
            <div className="flex bg-white border border-gray-200 rounded-md overflow-hidden">
              {structureButtons.map((button, index) => {
                let isActive = false;
                if (button.command === "formatBlock" && button.value) {
                    isActive = activeBlockType === button.value;
                } else if (button.command === "insertUnorderedList") {
                    isActive = activeBlockType === "ul";
                } else if (button.command === "insertOrderedList") {
                    isActive = activeBlockType === "ol";
                }
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      handleStructure(button.command, button.value)
                    }
                    className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors ${
                       isActive
                        ? "bg-gray-200"
                        : "hover:bg-gray-100"
                    } ${
                      index < structureButtons.length - 1
                        ? "border-r border-gray-200"
                        : ""
                    }`}
                    aria-label={button.alt}
                    aria-pressed={isActive}
                  >
                    <img
                      className="w-5 h-5"
                      alt={button.alt}
                      src={button.icon}
                    />
                  </button>
                );
              })}
            </div>
          </div>

    
          <style>
            {`
              [contenteditable][data-placeholder]:empty::before {
                content: attr(data-placeholder);
                color: #a0aec0; /* Example placeholder color (Tailwind's gray-500) */
                pointer-events: none; /* Important to allow clicks to focus */
                display: block; /* Ensures it takes up space */
              }
            `}
          </style>
          <div className="bg-white border border-gray-200 rounded-md p-4 min-h-[200px]">
            <div
              ref={editorRef}
              contentEditable
              className="outline-none min-h-[300px] text-sm leading-6 text-black"
              onInput={handleInput}
              onBlur={handleBlur} 
              data-placeholder="Start typing..."
             
            />
          </div>
        </section>
      </div>
    </main>
  );
};