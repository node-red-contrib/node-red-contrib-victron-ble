import { readFileSync } from 'fs';
import { join } from 'path';

export interface ProductMapping {
  id: number;
  name: string;
}

let productMappings: ProductMapping[] | null = null;

export function loadProductMappings(): ProductMapping[] {
  if (productMappings) {
    return productMappings;
  }

  try {
    const mappingPath = join(__dirname, '../../docs/Victron_ProductId_mapping.txt');
    const content = readFileSync(mappingPath, 'utf8');
    
    productMappings = content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const trimmedLine = line.trim();
        // Find the first space to separate ID from name
        const firstSpaceIndex = trimmedLine.indexOf(' ');
        if (firstSpaceIndex > 0) {
          const idStr = trimmedLine.substring(0, firstSpaceIndex);
          const name = trimmedLine.substring(firstSpaceIndex + 1).trim();
          const id = parseInt(idStr, 10);
          
          if (!isNaN(id) && name) {
            return { id, name };
          }
        }
        return null;
      })
      .filter((mapping): mapping is ProductMapping => mapping !== null);
    
    return productMappings;
  } catch (error) {
    console.warn('Could not load Victron Product ID mapping:', error);
    return [];
  }
}

export function getProductName(modelId: number): string | null {
  const mappings = loadProductMappings();
  const mapping = mappings.find(m => m.id === modelId);
  return mapping ? mapping.name : null;
}

export function getProductMappings(): ProductMapping[] {
  return loadProductMappings();
} 