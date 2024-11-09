// Constants for styling
const STYLES = {
  NODE: {
    WIDTH: 240,
    HEIGHT: 80,
    PADDING: 20,
    CORNER_RADIUS: 8,
    STROKE_WEIGHT: 2,
    FONT_SIZE: 14,
    SPACING: 300,
  },
  COLORS: {
    WHITE: { r: 1, g: 1, b: 1 },
    BLACK: { r: 0, g: 0, b: 0 },
    STROKE: { r: 0.2, g: 0.2, b: 0.2 },
  }
};

figma.showUI(__html__, { width: 400, height: 600 });

async function createFlowNode(text, x, y) {
  const node = figma.createFrame();
  node.name = `Flow Step: ${text}`;
  node.resize(STYLES.NODE.WIDTH, STYLES.NODE.HEIGHT);
  node.x = x;
  node.y = y;
  node.cornerRadius = STYLES.NODE.CORNER_RADIUS;
  node.fills = [{ type: 'SOLID', color: STYLES.COLORS.WHITE }];
  node.strokeWeight = STYLES.NODE.STROKE_WEIGHT;
  node.strokes = [{ type: 'SOLID', color: STYLES.COLORS.STROKE }];
  
  node.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.25 },
    offset: { x: 0, y: 2 },
    radius: 4,
    visible: true,
    blendMode: 'NORMAL'
  }];

  const textNode = figma.createText();
  textNode.name = "Flow Text";
  textNode.characters = text;
  textNode.fontSize = STYLES.NODE.FONT_SIZE;
  textNode.textAlignHorizontal = 'CENTER';
  textNode.textAlignVertical = 'CENTER';
  textNode.fills = [{ type: 'SOLID', color: STYLES.COLORS.BLACK }];
  
  const textWidth = node.width - STYLES.NODE.PADDING;
  const textHeight = node.height - STYLES.NODE.PADDING;
  textNode.resize(textWidth, textHeight);
  textNode.x = STYLES.NODE.PADDING / 2;
  textNode.y = STYLES.NODE.PADDING / 2;
  
  node.appendChild(textNode);
  return node;
}

function createArrow(startNode, endNode) {
  const connector = figma.createConnector();
  connector.name = `Arrow: ${startNode.name} → ${endNode.name}`;
  connector.strokeWeight = 2;
  connector.cornerRadius = 10;
  
  // Set connector endpoints
  connector.connectorStart = { 
    endpointNodeId: startNode.id, 
    magnet: 'AUTO' 
  };
  connector.connectorEnd = { 
    endpointNodeId: endNode.id, 
    magnet: 'AUTO' 
  };
  
  // Style the arrow
  connector.strokes = [{ type: 'SOLID', color: STYLES.COLORS.STROKE }];
  connector.connectorEndStrokeCap = 'ARROW_LINES';
  connector.connectorStartStrokeCap = 'NONE';
  
  return connector;
}

function organizeFlow(nodes, connectors) {
  // Create a new frame to contain the entire flow
  const container = figma.createFrame();
  container.name = "User Flow";
  
  // Set the initial size of the container
  const totalWidth = (nodes.length * STYLES.NODE.WIDTH) + ((nodes.length - 1) * STYLES.NODE.SPACING);
  const totalHeight = STYLES.NODE.HEIGHT + 120; // Extra space for arrows
  container.resize(totalWidth + 80, totalHeight);
  
  // Position nodes horizontally with spacing
  nodes.forEach((node, index) => {
    node.x = (index * (STYLES.NODE.WIDTH + (STYLES.NODE.SPACING - STYLES.NODE.WIDTH)));
    node.y = (totalHeight - STYLES.NODE.HEIGHT) / 2;
    container.appendChild(node);
  });
  
  // Add all connectors to the container
  connectors.forEach(connector => {
    container.appendChild(connector);
  });
  
  return container;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-flow') {
    try {
      const steps = msg.steps;
      if (steps.length < 2) {
        figma.notify('Please add at least 2 flow steps');
        return;
      }

      // Load the font first
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      
      const nodes = [];
      const connectors = [];
      
      // Create all nodes first
      for (let i = 0; i < steps.length; i++) {
        const node = await createFlowNode(steps[i], i * STYLES.NODE.SPACING, 0);
        nodes.push(node);
      }
      
      // Create connectors between all consecutive nodes
      for (let i = 0; i < nodes.length - 1; i++) {
        const connector = createArrow(nodes[i], nodes[i + 1]);
        connectors.push(connector);
      }
      
      // Organize everything in a container
      const container = organizeFlow(nodes, connectors);
      
      // Center the view on the created flow
      figma.viewport.scrollAndZoomIntoView([container]);
      
      // Select the container
      figma.currentPage.selection = [container];
      
      figma.notify('User flow generated successfully!');
    } catch (error) {
      figma.notify('Error generating flow: ' + error.message);
    }
  }

  if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};