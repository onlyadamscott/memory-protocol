/**
 * Clawdbot Adapter
 * 
 * Converts between Clawdbot's MEMORY.md / memory/*.md format
 * and Memory Protocol's structured format.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import type { MemoryObject, MemoryType, RememberRequest } from '../types.js';
import { MemoryStore } from '../store.js';

export interface ClawdbotMemoryConfig {
  workspaceDir: string;  // Path to clawdbot workspace (contains MEMORY.md, memory/)
}

/**
 * Import memories from Clawdbot format to Memory Protocol
 */
export async function importFromClawdbot(
  config: ClawdbotMemoryConfig,
  store: MemoryStore
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const results = { imported: 0, skipped: 0, errors: [] as string[] };
  
  // Import MEMORY.md (long-term curated memory)
  const memoryMdPath = join(config.workspaceDir, 'MEMORY.md');
  if (existsSync(memoryMdPath)) {
    try {
      const content = readFileSync(memoryMdPath, 'utf-8');
      const sections = parseMarkdownSections(content);
      
      for (const section of sections) {
        await store.remember({
          type: inferTypeFromSection(section.heading),
          content: {
            heading: section.heading,
            text: section.content,
            source: 'MEMORY.md',
          },
          tags: ['imported', 'long-term', ...extractTags(section.heading)],
          source: 'told',  // Imported, not experienced
        });
        results.imported++;
      }
    } catch (e) {
      results.errors.push(`Failed to import MEMORY.md: ${e}`);
    }
  }
  
  // Import memory/*.md daily logs
  const memoryDir = join(config.workspaceDir, 'memory');
  if (existsSync(memoryDir)) {
    const files = readdirSync(memoryDir).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      try {
        const content = readFileSync(join(memoryDir, file), 'utf-8');
        const date = extractDateFromFilename(file);
        const sections = parseMarkdownSections(content);
        
        for (const section of sections) {
          await store.remember({
            type: 'event',
            content: {
              heading: section.heading,
              text: section.content,
              date,
              source: `memory/${file}`,
            },
            tags: ['imported', 'daily-log', date || 'undated'],
            source: 'told',
          });
          results.imported++;
        }
      } catch (e) {
        results.errors.push(`Failed to import ${file}: ${e}`);
      }
    }
  }
  
  return results;
}

/**
 * Export memories to Clawdbot format
 */
export function exportToClawdbot(
  store: MemoryStore,
  config: ClawdbotMemoryConfig
): { files: string[] } {
  const files: string[] = [];
  
  // Export long-term memories to MEMORY.md
  const longTerm = store.recall({
    tags: ['long-term'],
    includeDeleted: false,
  });
  
  if (longTerm.length > 0) {
    const memoryMd = generateMemoryMd(longTerm);
    const path = join(config.workspaceDir, 'MEMORY.md');
    writeFileSync(path, memoryMd);
    files.push(path);
  }
  
  // Export events by date to memory/*.md
  const events = store.recall({
    type: 'event',
    includeDeleted: false,
  });
  
  // Group by date
  const byDate = new Map<string, MemoryObject[]>();
  for (const event of events) {
    const date = (event.content.date as string) || 
                 event.created.split('T')[0];
    if (!byDate.has(date)) {
      byDate.set(date, []);
    }
    byDate.get(date)!.push(event);
  }
  
  // Write daily files
  for (const [date, memories] of byDate) {
    const content = generateDailyMd(date, memories);
    const path = join(config.workspaceDir, 'memory', `${date}.md`);
    writeFileSync(path, content);
    files.push(path);
  }
  
  return { files };
}

// Helper functions

interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
}

function parseMarkdownSections(markdown: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  const lines = markdown.split('\n');
  
  let currentSection: MarkdownSection | null = null;
  let contentLines: string[] = [];
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        if (currentSection.content) {
          sections.push(currentSection);
        }
      }
      
      // Start new section
      currentSection = {
        heading: headingMatch[2],
        level: headingMatch[1].length,
        content: '',
      };
      contentLines = [];
    } else if (currentSection) {
      contentLines.push(line);
    }
  }
  
  // Save last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    if (currentSection.content) {
      sections.push(currentSection);
    }
  }
  
  return sections;
}

function inferTypeFromSection(heading: string): MemoryType {
  const lower = heading.toLowerCase();
  
  if (lower.includes('lesson') || lower.includes('learned')) return 'lesson';
  if (lower.includes('decision')) return 'decision';
  if (lower.includes('preference') || lower.includes('like')) return 'preference';
  if (lower.includes('relationship') || lower.includes('about')) return 'relationship';
  if (lower.includes('skill') || lower.includes('can do')) return 'skill';
  if (lower.includes('event') || lower.includes('happened')) return 'event';
  
  return 'fact';  // Default
}

function extractTags(heading: string): string[] {
  const tags: string[] = [];
  
  // Extract words that look like tags
  const words = heading.toLowerCase().split(/\s+/);
  const tagWords = ['identity', 'protocol', 'soul', 'memory', 'project', 
                    'adam', 'moltbook', 'important', 'lesson'];
  
  for (const word of words) {
    if (tagWords.includes(word)) {
      tags.push(word);
    }
  }
  
  return tags;
}

function extractDateFromFilename(filename: string): string | null {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function generateMemoryMd(memories: MemoryObject[]): string {
  let md = '# MEMORY.md — Long-Term Memory\n\n';
  md += '*Exported from Memory Protocol*\n\n';
  md += '---\n\n';
  
  // Group by tags
  const grouped = new Map<string, MemoryObject[]>();
  
  for (const memory of memories) {
    const category = memory.tags.find(t => 
      !['imported', 'long-term'].includes(t)
    ) || 'general';
    
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(memory);
  }
  
  for (const [category, mems] of grouped) {
    md += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    
    for (const mem of mems) {
      const heading = (mem.content.heading as string) || mem.type;
      const text = (mem.content.text as string) || JSON.stringify(mem.content);
      
      md += `### ${heading}\n\n`;
      md += `${text}\n\n`;
    }
  }
  
  return md;
}

function generateDailyMd(date: string, memories: MemoryObject[]): string {
  let md = `# ${date} — Day Notes\n\n`;
  
  for (const memory of memories) {
    const heading = (memory.content.heading as string) || 'Event';
    const text = (memory.content.text as string) || JSON.stringify(memory.content);
    
    md += `## ${heading}\n\n`;
    md += `${text}\n\n`;
  }
  
  return md;
}
