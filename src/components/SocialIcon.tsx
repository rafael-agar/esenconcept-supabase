import React from 'react';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Github, 
  Twitch, 
  MessageCircle, 
  Send, 
  Globe, 
  Share2,
  Music2,
  Camera,
  Ghost,
  AtSign
} from 'lucide-react';

interface SocialIconProps {
  name?: string;
  url?: string;
  size?: number;
  className?: string;
}

const TikTokIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={`fill-current ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.36-.54.38-.89.96-.99 1.6-.13.58-.1 1.18.09 1.74.36.93 1.2 1.63 2.18 1.81.74.14 1.53.01 2.18-.36.6-.33 1.03-.91 1.21-1.58.12-.48.13-.97.12-1.46-.01-4.58-.02-9.17-.03-13.75z"/>
  </svg>
);

const PinterestIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={`fill-current ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

export const SocialIcon: React.FC<SocialIconProps> = ({ name = '', url = '', size = 20, className = '' }) => {
  const combined = `${name} ${url}`.toLowerCase();

  if (combined.includes('instagram')) return <Instagram size={size} className={className} />;
  if (combined.includes('facebook')) return <Facebook size={size} className={className} />;
  if (combined.includes('twitter') || combined.includes(' x.com')) return <Twitter size={size} className={className} />;
  if (combined.includes('tiktok')) return <TikTokIcon size={size} className={className} />;
  if (combined.includes('youtube')) return <Youtube size={size} className={className} />;
  if (combined.includes('linkedin')) return <Linkedin size={size} className={className} />;
  if (combined.includes('pinterest')) return <PinterestIcon size={size} className={className} />;
  if (combined.includes('whatsapp') || combined.includes('wa.me')) return <MessageCircle size={size} className={className} />;
  if (combined.includes('telegram') || combined.includes('t.me')) return <Send size={size} className={className} />;
  if (combined.includes('github')) return <Github size={size} className={className} />;
  if (combined.includes('twitch')) return <Twitch size={size} className={className} />;
  if (combined.includes('snapchat')) return <Ghost size={size} className={className} />;
  if (combined.includes('threads')) return <AtSign size={size} className={className} />;
  
  // Generic fallbacks
  if (combined.includes('music') || combined.includes('spotify') || combined.includes('apple.com')) return <Music2 size={size} className={className} />;
  if (combined.includes('photo') || combined.includes('flickr')) return <Camera size={size} className={className} />;
  if (url.startsWith('http')) return <Globe size={size} className={className} />;
  
  return <Share2 size={size} className={className} />;
};

export default SocialIcon;
