export const TRANSCRIBER_CONFIG = {
    google: {
      models: [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
      ],
      languages: [
        "Multilingual", "Arabic", "Bengali", "Bulgarian", "Chinese", "Croatian",
        "Czech", "Danish", "Dutch", "English", "Estonian", "Finnish", "French",
        "German", "Greek", "Hebrew", "Hindi", "Hungarian", "Indonesian", "Italian",
        "Japanese", "Korean", "Latvian", "Lithuanian", "Norwegian", "Polish",
        "Portuguese", "Romanian", "Russian", "Serbian", "Slovak", "Slovenian",
        "Spanish", "Swahili", "Swedish", "Thai", "Turkish", "Ukrainian", "Vietnamese"
      ]
    },
    deepgram: {
      // models: [
      //   'nova', 'nova-2', 'nova-3', 'nova-general', 'nova-medical',
      //   'nova-2-general', 'nova-2-medical', 'nova-2-meeting', 'nova-2-phonecall',
      //   'nova-2-video', 'nova-2-voicemail', 'nova-2-automotive', 'nova-2-conversationalai',
      //   'nova-2-drivethru', 'nova-2-finance', 'nova-3-general', 'nova-3-medical',
      //   'enhanced', 'enhanced-general', 'enhanced-meeting', 'enhanced-phonecall',
      //   'enhanced-finance', 'base', 'base-general', 'base-meeting', 'base-phonecall',
      //   'base-video', 'base-voicemail', 'base-finance', 'base-conversationalai'
      // ],
      models: [
        'nova', 'nova-2', 'nova-3'
      ],
      languages: ['multi', 'en']
    }
  };