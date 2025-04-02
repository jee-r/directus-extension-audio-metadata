# Directus Extension: Audio Metadata

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Directus](https://img.shields.io/badge/directus-%2364f.svg?style=flat&logo=directus&logoColor=white)](https://directus.io/)

A Directus flow operation extension that extracts metadata from audio files stored in your Directus assets.

## Description

This operation allows you to retrieve comprehensive metadata from audio files directly within your Directus flows. The extension uses the [music-metadata](https://github.com/borewit/music-metadata) library to parse audio files and extract information such as duration, bitrate, sample rate, channels, and ID3 tags.

## Features

- Extract audio metadata from files stored in Directus assets
- Efficient extraction by only downloading the file header (configurable size)
- Support for multiple audio formats (MP3, WAV, FLAC, etc.)
- Includes formatted duration in milliseconds for easy use in flows
- Optional authentication for protected assets

## Requirements

- Directus version 10.10.0 or higher

## Installation

```bash
npm install @jee-r/directus-extension-audio-metadata
```

or

```bash
yarn add @jee-r/directus-extension-audio-metadata
```

## Usage

After installation, the operation will appear in the Directus flow editor under the name "Audio Metadata".

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| File Key | The file key from Directus assets | `{{ $trigger.key }}` |
| Base URL | The base URL for your Directus assets (e.g., `https://my-directus.com:8055/assets`) | - |
| Access Token | Optional access token for protected files | - |
| Header Size | Maximum bytes to download for the header (to optimize performance) | 262144 (256KB) |

### Example Flow

1. Create a new flow that triggers when an audio file is uploaded
2. Add the "Audio Metadata" operation
3. Configure the operation with your Directus assets URL
4. Use the output metadata in subsequent operations (e.g., store in a collection, transform data, etc.)

### Example Output

```json
{
  "metadata": {
    "format": {
      "tagTypes": ["ID3v2.3", "ID3v1"],
      "lossless": false,
      "container": "MPEG",
      "codec": "MPEG 1 Layer 3",
      "sampleRate": 44100,
      "numberOfChannels": 2,
      "bitrate": 320000,
      "duration": 237.09
    },
    "native": {
      "ID3v2.3": [
        {
          "id": "TPE1",
          "value": "Artist Name"
        },
        {
          "id": "TIT2",
          "value": "Track Title"
        },
        {
          "id": "TALB",
          "value": "Album Name"
        }
      ]
    },
    "common": {
      "track": {
        "no": 1,
        "of": 12
      },
      "disk": {
        "no": 1,
        "of": 1
      },
      "title": "Track Title",
      "album": "Album Name",
      "artist": "Artist Name",
      "year": 2023
    }
  },
  "durationms": 237090,
  "file_url": "https://my-directus.com:8055/assets/file-key"
}
```

## Development

To build the extension:

```bash
npm run build
```

For development with automatic rebuilds:

```bash
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.