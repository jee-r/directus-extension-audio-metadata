import { defineOperationApp } from "@directus/extensions-sdk"

export default defineOperationApp({
  id: "audio-metadata",
  name: "Audio Metada",
  icon: "audio_file",
  description: "Get metadatas from Audio File",
  overview: ({ fileKey, baseUrl }) => [
    {
      label: "audio url",
      text: `${baseUrl}${fileKey}`,
    },
  ],
  options: [
    {
      field: "fileKey",
      name: "File Key",
      type: "string",
      meta: {
        width: "full",
        interface: "input",
        options: {
          placeholder: "The file key from Directus assets",
        },
      },
      schema: {
        default_value: "{{ $trigger.key }}",
      },
    },
    {
      field: "baseUrl",
      name: "Base Url",
      type: "string",
      meta: {
        width: "full",
        interface: "input",
        required: true,
        options: {
          placeholder: "https://my-directus.com:<PORT>/assets",
        },
      },
    },
    {
      field: "accessToken",
      name: "Access Token",
      type: "string",
      meta: {
        width: "full",
        interface: "input",
      },
    },
    {
      field: "maxBytes",
      name: "Header Size (bytes)",
      type: "integer",
      meta: {
        width: "half",
        interface: "input",
        required: true,
        options: {
          placeholder: "Maximum bytes to download for header",
        },
      },
      schema: {
        default_value: 262144, // 256KB
      },
    },
    {
      field: "downloadFullFile",
      name: "Download Full File",
      type: "boolean",
      meta: {
				width: "half",
        interface: "boolean",
        options: {
          label: "Download Full File for Accurate Duration",
        },
        note: "Enable this for accurate duration detection of long audio files. Warning: This will download the entire file and may be slower.",
      },
      schema: {
        default_value: false,
      },
    },
  ],
})
