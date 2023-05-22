import { 
  File as FileType,
  isFile,
  isFlowContent,
  paragraph,
  statement,
  text,
} from "@mintter/shared"
import {
  Button,
  File as FileIcon,
  Label,
  Popover,
  SizableText,
  Tabs
} from '@mintter/ui'
import { XStack, YStack } from "@mintter/ui"
import { WebviewWindow } from "@tauri-apps/api/window"
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react"
import { Editor, Path, Transforms } from "slate"
import { ReactEditor, RenderElementProps, useFocused, useSelected, useSlateStatic } from "slate-react"
import { EditorPlugin } from "../types"
import { findPath } from "../utils"

interface InnerFileType extends FileType {
  name: string
  size: number
}

type InnerFileProps = {
  file: InnerFileType
  assign: (file: InnerFileType) => void
  element: FileType
}

export const ELEMENT_FILE = 'file'

export function createFilePlugin(): EditorPlugin {
  return {
    name: ELEMENT_FILE,
    configureEditor(editor) {
      const {isVoid, isInline} = editor

      editor.isVoid = function fileVoid(element) {
        return isFile(element) || isVoid(element)
      }

      editor.isInline = function fileInline(element) {
        return isFile(element) || isInline(element)
      }

      return editor
    },
  }
}

export function FileElement({
  element,
  attributes,
  children,
}: RenderElementProps) {
  const editor = useSlateStatic()
  const path = ReactEditor.findPath(editor, element)
  const [file, setFile] = useState<InnerFileType>({name: '', size: 0, url: '', alt: '', children: [], type: 'file'} as InnerFileType)

  useEffect(() => {

  }, [file])

  const assignFile = (newFile: InnerFileType) => {
    setFile({...file, ...newFile})
    if (newFile.url)
      Transforms.setNodes<FileType>(editor, {url: newFile.url}, {at: path})
  }

  return (
    <YStack {...attributes}>
      {children}
      {file.url.length ? (
        <FileComponent file={file} assign={assignFile} element={element as FileType} />
      ) : (
        <FileForm file={file} assign={assignFile} element={element as FileType} />
      )}
    </YStack>
  )
}

function FileComponent({assign, element, file}: InnerFileProps) {
  const editor = useSlateStatic()
  const selected = useSelected()
  const focused = useFocused()
  const path = useMemo(() => findPath(element), [element])

  const onKeyPress = useCallback((event: any) => {
    if (event.nativeEvent.key == 'Enter') {
      // This will create a new block below the file and focus on it

      event.preventDefault()

      let parentBlock = Editor.above(editor, {
        match: isFlowContent,
        at: path,
      })

      if (parentBlock) {
        let [, pPath] = parentBlock
        let newBlock = statement([paragraph([text('')])])
        let newPath = Path.next(pPath)
        Editor.withoutNormalizing(editor, () => {
          Transforms.insertNodes(editor, newBlock, {at: newPath})
          ReactEditor.focus(editor)
          setTimeout(() => {
            Transforms.select(editor, newPath)
          }, 10)
        })
      }
    }
  }, [])
  
  return (
    <Button
      theme="gray"
      borderRadius={1}
      size="$5"
      justifyContent="flex-start"
      icon={FileIcon}
      onPress={() => {
        const webview = new WebviewWindow(`File`, {
          url: `http://localhost:55001/ipfs/${(element as FileType).url}`,
        })
        webview.once('tauri://error', function (e) {
          console.log(e)
        })
      }}
    >
      {file.name}
    </Button>
  )
}

function FileForm({assign, element}: InnerFileProps) {
  const [tabState, setTabState] = useState('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<{name: string; color: string}>({
    name: 'Upload File',
    color: 'black',
  })

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      if (fileList[0].size <= 62914560) {
        setSelectedFile(fileList[0])
        setFileName({name: fileList[0].name, color: 'black'})
      } else setFileName({name: 'The file size exceeds 60 MB', color: 'red'})
    }
  }

  const handleUpload = async () => {
    if (selectedFile) {
      const {size, name} = selectedFile
      const formData = new FormData()
      formData.append('file', selectedFile)

      try {
        const response = await fetch(
          'http://localhost:55001/ipfs/file-upload',
          {
            method: 'POST',
            body: formData,
          },
        )
        const data = await response.text()
        assign({url: data, size: size, name: name} as InnerFileType)
      } catch (error) {
        console.error(error)
      }
    }
  }

  return (
    //@ts-ignore
    <YStack contentEditable={false}>
      <Popover size="$5">
        <Popover.Trigger asChild>
          <Button
            icon={FileIcon}
            theme="gray"
            borderRadius={0}
            size="$5"
            justifyContent="flex-start"
          >
            Add a File
          </Button>
        </Popover.Trigger>
        <Popover.Content
          padding={0}
          elevation="$4"
          size="$5"
          enterStyle={{x: 0, y: -1, opacity: 0}}
          exitStyle={{x: 0, y: -1, opacity: 0}}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
        >
          <Tabs
            value={tabState}
            onValueChange={setTabState}
            orientation="horizontal"
            flexDirection="column"
            borderWidth="$1"
            borderColor="white"
            borderRadius="$5"
            width={500}
          >
            <Tabs.List
              marginBottom="$-0.5"
              backgroundColor="white"
              borderBottomColor="lightgrey"
              borderBottomWidth="$1"
              borderBottomLeftRadius={0}
              borderBottomRightRadius={0}
              borderRadius={0}
            >
              <Tabs.Tab
                unstyled
                value="upload"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderBottomLeftRadius={0}
                borderBottomRightRadius={0}
                borderRadius={0}
                borderBottomColor={tabState == 'upload' ? 'black' : ''}
                borderBottomWidth={tabState == 'upload' ? '$1' : '$0'}
                hoverStyle={{
                  backgroundColor: 'lightgrey',
                  cursor: 'pointer',
                }}
              >
                <SizableText size="$2" color="black">
                  Upload
                </SizableText>
              </Tabs.Tab>
              {/* <Tabs.Tab
                unstyled
                value="embed"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderBottomLeftRadius={0}
                borderBottomRightRadius={0}
                borderRadius={0}
                borderBottomColor={tabState == 'embed' ? 'black' : ''}
                borderBottomWidth={tabState == 'embed' ? '$1' : '$0'}
                hoverStyle={{
                  backgroundColor: 'lightgrey',
                  cursor: 'pointer',
                }}
              >
                <SizableText size="$2" color='black'>Embed Link</SizableText>
              </Tabs.Tab> */}
            </Tabs.List>

            <Tabs.Content value="upload">
              <XStack padding="$4" alignItems="center" backgroundColor="white">
                <XStack flex={1} backgroundColor="white">
                  <Label
                    htmlFor="file-upload"
                    borderColor="lightgrey"
                    borderWidth="$0.5"
                    size="$3"
                    width={400}
                    justifyContent="center"
                    hoverStyle={{
                      backgroundColor: 'lightgrey',
                      cursor: 'pointer',
                    }}
                  >
                    <SizableText
                      padding="$2"
                      overflow="hidden"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      color={fileName.color}
                    >
                      {fileName.name}
                    </SizableText>
                  </Label>
                  <input
                    id="file-upload"
                    type="file"
                    style={{
                      background: 'white',
                      padding: '0 2px',
                      display: 'none',
                    }}
                    onChange={handleFileChange}
                  />
                </XStack>
                <Popover.Close asChild>
                  <Button
                    size="$2"
                    flex={0}
                    flexShrink={0}
                    theme={fileName.color === 'red' ? 'gray' : 'green'}
                    disabled={fileName.color === 'red' ? true : false}
                    onPress={handleUpload}
                  >
                    Save
                  </Button>
                </Popover.Close>
              </XStack>
            </Tabs.Content>
            {/* <Tabs.Content value="embed">
              <SizableText padding="$4" alignItems="center" backgroundColor='white'>Just test</SizableText>
            </Tabs.Content> */}
            {/* <Tabs.Content value="embed">
              <Box
                as="form"
                css={{
                  width: '$full',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '$4',
                }}
                onSubmit={submitImage}
              >
                <Input placeholder="Add an Image URL" name="url" />
                <Button type="submit">Save</Button>
                <Button
                  type="button"
                  size="0"
                  variant="ghost"
                  color="muted"
                  onClick={() => send('IMAGE.CANCEL')}
                >
                  Cancel
                </Button>
              </Box>
            </Tabs.Content> */}
          </Tabs>
        </Popover.Content>
      </Popover>
    </YStack>
  )
}