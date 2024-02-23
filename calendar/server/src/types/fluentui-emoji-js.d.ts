declare module 'fluentui-emoji-js' {

  const emojiFolder: string
  const emojiDataFile: string

  // Valid emoji skintones
    type Skintone = 'Default' | 'Light' | 'Medium-Light' | 'Medium' | 'Medium-Dark' | 'Dark'

    // All valid Fluent Emoji styles
    type Style = '3D' | 'Color' | 'Flat' | 'High Contrast'

    // Command-line arguments type
    type Args = string[]

    interface EmojiMetaData {
      unicodeSkintones?: string[]
      unicode: string
      glyph: string
    }

    type EmojiImage = Record<string, string[]>

    interface EmojiData {
      glyph: string
      unicode: string
      folder: string
      images: EmojiImage
      emojiStyles: Style[]
    }

    // Function declarations
    function getFolders (dir: string): Promise<string[]>

    function getFiles (dir: string): Promise<string[]>

    function generateEmojiData (): Promise<void>

    function loadEmojiData (): Promise<void>

    function getEmoji (key: 'glyph' | 'unicode', q: string, style: Style): Promise<string | undefined>

    function fromGlyph (glyph: string, style: Style): Promise<string | undefined>

    function fromCode (code: string, style: Style): Promise<string | undefined>

    // Exported functions
    export { fromGlyph, fromCode }
}
