/**
 * AI System for GameForge
 * 
 * Provides behavior trees, pathfinding, and decision making for game entities.
 */

import { GameObject } from '../core/types';

// =============================================
// Behavior Tree System
// =============================================

export enum BehaviorStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  RUNNING = 'RUNNING'
}

export interface BehaviorNode {
  execute(agent: Agent, deltaTime: number): BehaviorStatus;
  reset(agent: Agent): void;
}

export class Sequence implements BehaviorNode {
  private children: BehaviorNode[];
  private currentIndex: Map<string, number> = new Map();
  
  constructor(children: BehaviorNode[]) {
    this.children = children;
  }
  
  public execute(agent: Agent, deltaTime: number): BehaviorStatus {
    const agentId = agent.getId();
    if (!this.currentIndex.has(agentId)) {
      this.currentIndex.set(agentId, 0);
    }
    
    const index = this.currentIndex.get(agentId)!;
    
    if (index >= this.children.length) {
      return BehaviorStatus.SUCCESS;
    }
    
    const status = this.children[index].execute(agent, deltaTime);
    
    if (status === BehaviorStatus.RUNNING) {
      return BehaviorStatus.RUNNING;
    } else if (status === BehaviorStatus.FAILURE) {
      this.currentIndex.set(agentId, 0);
      return BehaviorStatus.FAILURE;
    } else {
      this.currentIndex.set(agentId, index + 1);
      
      if (index + 1 >= this.children.length) {
        this.currentIndex.set(agentId, 0);
        return BehaviorStatus.SUCCESS;
      } else {
        return BehaviorStatus.RUNNING;
      }
    }
  }
  
  public reset(agent: Agent): void {
    this.currentIndex.delete(agent.getId());
    this.children.forEach(child => child.reset(agent));
  }
}

export class Selector implements BehaviorNode {
  private children: BehaviorNode[];
  private currentIndex: Map<string, number> = new Map();
  
  constructor(children: BehaviorNode[]) {
    this.children = children;
  }
  
  public execute(agent: Agent, deltaTime: number): BehaviorStatus {
    const agentId = agent.getId();
    if (!this.currentIndex.has(agentId)) {
      this.currentIndex.set(agentId, 0);
    }
    
    const index = this.currentIndex.get(agentId)!;
    
    if (index >= this.children.length) {
      return BehaviorStatus.FAILURE;
    }
    
    const status = this.children[index].execute(agent, deltaTime);
    
    if (status === BehaviorStatus.RUNNING) {
      return BehaviorStatus.RUNNING;
    } else if (status === BehaviorStatus.SUCCESS) {
      this.currentIndex.set(agentId, 0);
      return BehaviorStatus.SUCCESS;
    } else {
      this.currentIndex.set(agentId, index + 1);
      
      if (index + 1 >= this.children.length) {
        this.currentIndex.set(agentId, 0);
        return BehaviorStatus.FAILURE;
      } else {
        return BehaviorStatus.RUNNING;
      }
    }
  }
  
  public reset(agent: Agent): void {
    this.currentIndex.delete(agent.getId());
    this.children.forEach(child => child.reset(agent));
  }
}

export class Inverter implements BehaviorNode {
  private child: BehaviorNode;
  
  constructor(child: BehaviorNode) {
    this.child = child;
  }
  
  public execute(agent: Agent, deltaTime: number): BehaviorStatus {
    const status = this.child.execute(agent, deltaTime);
    
    if (status === BehaviorStatus.RUNNING) {
      return BehaviorStatus.RUNNING;
    } else if (status === BehaviorStatus.SUCCESS) {
      return BehaviorStatus.FAILURE;
    } else {
      return BehaviorStatus.SUCCESS;
    }
  }
  
  public reset(agent: Agent): void {
    this.child.reset(agent);
  }
}

export class Condition implements BehaviorNode {
  private condition: (agent: Agent) => boolean;
  
  constructor(condition: (agent: Agent) => boolean) {
    this.condition = condition;
  }
  
  public execute(agent: Agent, deltaTime: number): BehaviorStatus {
    return this.condition(agent) ? BehaviorStatus.SUCCESS : BehaviorStatus.FAILURE;
  }
  
  public reset(agent: Agent): void {
    // No state to reset
  }
}

export class Action implements BehaviorNode {
  private action: (agent: Agent, deltaTime: number) => BehaviorStatus;
  private onEnter?: (agent: Agent) => void;
  private onExit?: (agent: Agent) => void;
  private isRunning: Map<string, boolean> = new Map();
  
  constructor(
    action: (agent: Agent, deltaTime: number) => BehaviorStatus,
    onEnter?: (agent: Agent) => void,
    onExit?: (agent: Agent) => void
  ) {
    this.action = action;
    this.onEnter = onEnter;
    this.onExit = onExit;
  }
  
  public execute(agent: Agent, deltaTime: number): BehaviorStatus {
    const agentId = agent.getId();
    const wasRunning = this.isRunning.get(agentId) || false;
    
    if (!wasRunning && this.onEnter) {
      this.onEnter(agent);
    }
    
    this.isRunning.set(agentId, true);
    
    const status = this.action(agent, deltaTime);
    
    if (status !== BehaviorStatus.RUNNING) {
      this.isRunning.set(agentId, false);
      
      if (this.onExit) {
        this.onExit(agent);
      }
    }
    
    return status;
  }
  
  public reset(agent: Agent): void {
    const agentId = agent.getId();
    const wasRunning = this.isRunning.get(agentId) || false;
    
    if (wasRunning && this.onExit) {
      this.onExit(agent);
    }
    
    this.isRunning.delete(agentId);
  }
}

export class Parallel implements BehaviorNode {
  private children: BehaviorNode[];
  private requiredSuccesses: number;
  private statuses: Map<string, BehaviorStatus[]> = new Map();
  
  constructor(children: BehaviorNode[], requiredSuccesses: number = -1) {
    this.children = children;
    this.requiredSuccesses = requiredSuccesses < 0 ? children.length : requiredSuccesses;
  }
  
  public execute(agent: Agent, deltaTime: number): BehaviorStatus {
    const agentId = agent.getId();
    
    if (!this.statuses.has(agentId)) {
      this.statuses.set(agentId, this.children.map(() => BehaviorStatus.RUNNING));
    }
    
    const statuses = this.statuses.get(agentId)!;
    let runningCount = 0;
    let successCount = 0;
    let failureCount = 0;
    
    this.children.forEach((child, index) => {
      if (statuses[index] === BehaviorStatus.RUNNING) {
        statuses[index] = child.execute(agent, deltaTime);
      }
      
      if (statuses[index] === BehaviorStatus.RUNNING) {
        runningCount++;
      } else if (statuses[index] === BehaviorStatus.SUCCESS) {
        successCount++;
      } else {
        failureCount++;
      }
    });
    
    if (successCount >= this.requiredSuccesses) {
      this.statuses.delete(agentId);
      return BehaviorStatus.SUCCESS;
    } else if (failureCount > this.children.length - this.requiredSuccesses) {
      this.statuses.delete(agentId);
      return BehaviorStatus.FAILURE;
    } else {
      return BehaviorStatus.RUNNING;
    }
  }
  
  public reset(agent: Agent): void {
    this.statuses.delete(agent.getId());
    this.children.forEach(child => child.reset(agent));
  }
}

export class RepeatUntilFailure implements BehaviorNode {
  private child: BehaviorNode;
  
  constructor(child: BehaviorNode) {
    this.child = child;
  }
  
  public execute(agent: Agent, deltaTime: number): BehaviorStatus {
    const status = this.child.execute(agent, deltaTime);
    
    if (status === BehaviorStatus.FAILURE) {
      return BehaviorStatus.FAILURE;
    } else if (status === BehaviorStatus.SUCCESS) {
      this.child.reset(agent);
      return BehaviorStatus.RUNNING;
    }
    
    return BehaviorStatus.RUNNING;
  }
  
  public reset(agent: Agent): void {
    this.child.reset(agent);
  }
}

export class Wait implements BehaviorNode {
  private duration: number;
  private timeElapsed: Map<string, number> = new Map();
  
  constructor(duration: number) {
    this.duration = duration;
  }
  
  public execute(agent: Agent, deltaTime: number): BehaviorStatus {
    const agentId = agent.getId();
    
    if (!this.timeElapsed.has(agentId)) {
      this.timeElapsed.set(agentId, 0);
    }
    
    const elapsed = this.timeElapsed.get(agentId)! + deltaTime;
    this.timeElapsed.set(agentId, elapsed);
    
    if (elapsed >= this.duration) {
      this.timeElapsed.delete(agentId);
      return BehaviorStatus.SUCCESS;
    } else {
      return BehaviorStatus.RUNNING;
    }
  }
  
  public reset(agent: Agent): void {
    this.timeElapsed.delete(agent.getId());
  }
}

export class BehaviorTree {
  private root: BehaviorNode;
  
  constructor(root: BehaviorNode) {
    this.root = root;
  }
  
  public execute(agent: Agent, deltaTime: number): BehaviorStatus {
    return this.root.execute(agent, deltaTime);
  }
  
  public reset(agent: Agent): void {
    this.root.reset(agent);
  }
}

// =============================================
// Pathfinding System
// =============================================

export interface NavigationMesh {
  vertices: [number, number, number][];
  indices: number[][];
  getClosestPoint(position: [number, number, number]): [number, number, number];
  getRandomPoint(): [number, number, number];
  raycast(start: [number, number, number], end: [number, number, number]): [number, number, number] | null;
}

export class NavMeshNode {
  public readonly id: number;
  public readonly position: [number, number, number];
  public readonly connections: Map<number, number>; // nodeId -> cost
  
  constructor(id: number, position: [number, number, number]) {
    this.id = id;
    this.position = position;
    this.connections = new Map();
  }
  
  public addConnection(nodeId: number, cost: number): void {
    this.connections.set(nodeId, cost);
  }
  
  public removeConnection(nodeId: number): void {
    this.connections.delete(nodeId);
  }
}

export class NavMesh implements NavigationMesh {
  public vertices: [number, number, number][] = [];
  public indices: number[][] = [];
  private nodes: Map<number, NavMeshNode> = new Map();
  
  constructor() {
    // This would be populated from a navigation mesh file or generated at runtime
  }
  
  public addNode(id: number, position: [number, number, number]): void {
    this.nodes.set(id, new NavMeshNode(id, position));
    this.vertices.push(position);
  }
  
  public connectNodes(fromId: number, toId: number, bidirectional: boolean = true): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    
    if (!fromNode || !toNode) {
      console.error(`Cannot connect nodes: ${fromId} -> ${toId}, one or both nodes don't exist`);
      return;
    }
    
    const dx = toNode.position[0] - fromNode.position[0];
    const dy = toNode.position[1] - fromNode.position[1];
    const dz = toNode.position[2] - fromNode.position[2];
    const cost = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    fromNode.addConnection(toId, cost);
    
    if (bidirectional) {
      toNode.addConnection(fromId, cost);
    }
  }
  
  public findPath(startPosition: [number, number, number], endPosition: [number, number, number]): [number, number, number][] {
    const startNode = this.getClosestNode(startPosition);
    const endNode = this.getClosestNode(endPosition);
    
    if (!startNode || !endNode) {
      return [];
    }
    
    // A* pathfinding algorithm
    const openSet: number[] = [startNode.id];
    const cameFrom: Map<number, number> = new Map();
    
    const gScore: Map<number, number> = new Map();
    gScore.set(startNode.id, 0);
    
    const fScore: Map<number, number> = new Map();
    fScore.set(startNode.id, this.heuristic(startNode.position, endNode.position));
    
    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet[0];
      let lowestFScore = fScore.get(current) ?? Infinity;
      
      for (let i = 1; i < openSet.length; i++) {
        const nodeId = openSet[i];
        const score = fScore.get(nodeId) ?? Infinity;
        
        if (score < lowestFScore) {
          current = nodeId;
          lowestFScore = score;
        }
      }
      
      if (current === endNode.id) {
        return this.reconstructPath(cameFrom, current);
      }
      
      openSet.splice(openSet.indexOf(current), 1);
      
      const currentNode = this.nodes.get(current)!;
      
      currentNode.connections.forEach((cost, neighborId) => {
        const tentativeGScore = (gScore.get(current) ?? Infinity) + cost;
        
        if (tentativeGScore < (gScore.get(neighborId) ?? Infinity)) {
          cameFrom.set(neighborId, current);
          gScore.set(neighborId, tentativeGScore);
          fScore.set(neighborId, tentativeGScore + this.heuristic(this.nodes.get(neighborId)!.position, endNode.position));
          
          if (!openSet.includes(neighborId)) {
            openSet.push(neighborId);
          }
        }
      });
    }
    
    return []; // No path found
  }
  
  private reconstructPath(cameFrom: Map<number, number>, current: number): [number, number, number][] {
    const path: [number, number, number][] = [this.nodes.get(current)!.position];
    
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(this.nodes.get(current)!.position);
    }
    
    return path;
  }
  
  private heuristic(a: [number, number, number], b: [number, number, number]): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  private getClosestNode(position: [number, number, number]): NavMeshNode | null {
    let closestNode: NavMeshNode | null = null;
    let closestDistance = Infinity;
    
    this.nodes.forEach(node => {
      const dx = node.position[0] - position[0];
      const dy = node.position[1] - position[1];
      const dz = node.position[2] - position[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance < closestDistance) {
        closestNode = node;
        closestDistance = distance;
      }
    });
    
    return closestNode;
  }
  
  public getClosestPoint(position: [number, number, number]): [number, number, number] {
    const node = this.getClosestNode(position);
    return node ? node.position : [0, 0, 0];
  }
  
  public getRandomPoint(): [number, number, number] {
    const nodeIds = Array.from(this.nodes.keys());
    
    if (nodeIds.length === 0) {
      return [0, 0, 0];
    }
    
    const randomId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    return this.nodes.get(randomId)!.position;
  }
  
  public raycast(start: [number, number, number], end: [number, number, number]): [number, number, number] | null {
    // This would perform raycasting against the navigation mesh
    // For simplicity, just return null (no hit)
    return null;
  }
}

// =============================================
// Agent System
// =============================================

export interface AgentConfig {
  speed: number;
  turnSpeed: number;
  acceleration: number;
  stoppingDistance: number;
  obstacleAvoidanceRadius: number;
  maxSlopeAngle: number;
  targetTagToChase?: string;
  targetTagToFlee?: string;
  patrolPoints?: [number, number, number][];
  detectionRadius?: number;
  fieldOfView?: number;
  hearingRadius?: number;
}

export class Agent {
  private id: string;
  private gameObject: GameObject;
  private config: AgentConfig;
  private behaviorTree?: BehaviorTree;
  private path: [number, number, number][] = [];
  private currentPathIndex: number = 0;
  private currentTarget?: [number, number, number];
  private velocity: [number, number, number] = [0, 0, 0];
  private blackboard: Map<string, any> = new Map();
  
  constructor(id: string, gameObject: GameObject, config: AgentConfig) {
    this.id = id;
    this.gameObject = gameObject;
    this.config = config;
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getGameObject(): GameObject {
    return this.gameObject;
  }
  
  public getConfig(): AgentConfig {
    return { ...this.config };
  }
  
  public setConfig(config: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  public setBehaviorTree(behaviorTree: BehaviorTree): void {
    this.behaviorTree = behaviorTree;
  }
  
  public setPath(path: [number, number, number][]): void {
    this.path = path;
    this.currentPathIndex = 0;
  }
  
  public getPath(): [number, number, number][] {
    return [...this.path];
  }
  
  public setTarget(target: [number, number, number] | undefined): void {
    this.currentTarget = target;
  }
  
  public getTarget(): [number, number, number] | undefined {
    return this.currentTarget;
  }
  
  public getVelocity(): [number, number, number] {
    return [...this.velocity];
  }
  
  public setVelocity(velocity: [number, number, number]): void {
    this.velocity = [...velocity];
  }
  
  public setBlackboardValue(key: string, value: any): void {
    this.blackboard.set(key, value);
  }
  
  public getBlackboardValue(key: string): any {
    return this.blackboard.get(key);
  }
  
  public hasBlackboardValue(key: string): boolean {
    return this.blackboard.has(key);
  }
  
  public clearBlackboardValue(key: string): void {
    this.blackboard.delete(key);
  }
  
  public update(deltaTime: number): void {
    if (this.behaviorTree) {
      this.behaviorTree.execute(this, deltaTime);
    }
  }
  
  public moveTowards(target: [number, number, number], deltaTime: number): boolean {
    if (!this.gameObject.transform) return false;
    
    const position = this.gameObject.transform.position;
    
    // Calculate direction to target
    const dx = target[0] - position[0];
    const dy = target[1] - position[1];
    const dz = target[2] - position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Check if we're already at the target
    if (distance <= this.config.stoppingDistance) {
      this.velocity = [0, 0, 0];
      return true;
    }
    
    // Calculate desired velocity
    const direction: [number, number, number] = [dx / distance, dy / distance, dz / distance];
    const desiredVelocity: [number, number, number] = [
      direction[0] * this.config.speed,
      direction[1] * this.config.speed,
      direction[2] * this.config.speed
    ];
    
    // Apply acceleration
    this.velocity = [
      this.velocity[0] + (desiredVelocity[0] - this.velocity[0]) * this.config.acceleration * deltaTime,
      this.velocity[1] + (desiredVelocity[1] - this.velocity[1]) * this.config.acceleration * deltaTime,
      this.velocity[2] + (desiredVelocity[2] - this.velocity[2]) * this.config.acceleration * deltaTime
    ];
    
    // Move the game object
    this.gameObject.transform.position = [
      position[0] + this.velocity[0] * deltaTime,
      position[1] + this.velocity[1] * deltaTime,
      position[2] + this.velocity[2] * deltaTime
    ];
    
    // Update rotation to face movement direction
    if (Math.abs(this.velocity[0]) > 0.001 || Math.abs(this.velocity[2]) > 0.001) {
      const targetRotationY = Math.atan2(this.velocity[0], this.velocity[2]) * (180 / Math.PI);
      
      // Apply turn speed
      let currentRotationY = this.gameObject.transform.rotation?.[1] || 0;
      const angleDiff = this.getAngleDifference(currentRotationY, targetRotationY);
      const maxTurn = this.config.turnSpeed * deltaTime;
      const turnAmount = Math.min(Math.abs(angleDiff), maxTurn) * Math.sign(angleDiff);
      
      currentRotationY += turnAmount;
      
      this.gameObject.transform.rotation = [
        this.gameObject.transform.rotation?.[0] || 0,
        currentRotationY,
        this.gameObject.transform.rotation?.[2] || 0
      ];
    }
    
    return false;
  }
  
  public followPath(deltaTime: number): boolean {
    if (this.path.length === 0) return true;
    
    const currentWaypoint = this.path[this.currentPathIndex];
    const reachedWaypoint = this.moveTowards(currentWaypoint, deltaTime);
    
    if (reachedWaypoint) {
      this.currentPathIndex++;
      
      if (this.currentPathIndex >= this.path.length) {
        this.path = [];
        this.currentPathIndex = 0;
        return true;
      }
    }
    
    return false;
  }
  
  private getAngleDifference(a: number, b: number): number {
    let diff = (b - a) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }
}

// =============================================
// AI System
// =============================================

export class AISystem {
  private static instance: AISystem;
  private agents: Map<string, Agent> = new Map();
  private navigationMesh?: NavigationMesh;
  private isInitialized: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): AISystem {
    if (!AISystem.instance) {
      AISystem.instance = new AISystem();
    }
    return AISystem.instance;
  }
  
  public initialize(navigationMesh?: NavigationMesh): void {
    if (this.isInitialized) return;
    
    console.log('Initializing AI system...');
    
    this.navigationMesh = navigationMesh;
    
    this.isInitialized = true;
    console.log('AI system initialized successfully');
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    // Update all agents
    this.agents.forEach(agent => {
      agent.update(deltaTime);
    });
  }
  
  public createAgent(id: string, gameObject: GameObject, config: AgentConfig): Agent {
    const agent = new Agent(id, gameObject, config);
    this.agents.set(id, agent);
    return agent;
  }
  
  public removeAgent(id: string): void {
    this.agents.delete(id);
  }
  
  public getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }
  
  public setNavigationMesh(navigationMesh: NavigationMesh): void {
    this.navigationMesh = navigationMesh;
  }
  
  public getNavigationMesh(): NavigationMesh | undefined {
    return this.navigationMesh;
  }
  
  public findPath(start: [number, number, number], end: [number, number, number]): [number, number, number][] {
    if (!this.navigationMesh) {
      console.error('No navigation mesh available for pathfinding');
      return [];
    }
    
    return this.navigationMesh.findPath(start, end);
  }
  
  public getAgentsInRadius(position: [number, number, number], radius: number): Agent[] {
    const results: Agent[] = [];
    
    this.agents.forEach(agent => {
      const agentPosition = agent.getGameObject().transform?.position;
      
      if (agentPosition) {
        const dx = agentPosition[0] - position[0];
        const dy = agentPosition[1] - position[1];
        const dz = agentPosition[2] - position[2];
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        
        if (distanceSquared <= radius * radius) {
          results.push(agent);
        }
      }
    });
    
    return results;
  }
  
  public createPatrolBehavior(points: [number, number, number][], loop: boolean = true): BehaviorNode {
    return new Action(
      (agent: Agent, deltaTime: number) => {
        if (!agent.hasBlackboardValue('patrolIndex')) {
          agent.setBlackboardValue('patrolIndex', 0);
        }
        
        const index = agent.getBlackboardValue('patrolIndex');
        
        if (index >= points.length) {
          if (loop) {
            agent.setBlackboardValue('patrolIndex', 0);
            agent.setPath([points[0]]);
          } else {
            return BehaviorStatus.SUCCESS;
          }
        }
        
        const currentTarget = points[index];
        
        if (!agent.getPath().length) {
          agent.setPath([currentTarget]);
        }
        
        const completed = agent.followPath(deltaTime);
        
        if (completed) {
          agent.setBlackboardValue('patrolIndex', index + 1);
          
          if (index + 1 < points.length) {
            agent.setPath([points[index + 1]]);
          } else if (loop) {
            agent.setBlackboardValue('patrolIndex', 0);
            agent.setPath([points[0]]);
          } else {
            return BehaviorStatus.SUCCESS;
          }
        }
        
        return BehaviorStatus.RUNNING;
      },
      (agent: Agent) => {
        agent.setBlackboardValue('patrolIndex', 0);
        if (points.length > 0) {
          agent.setPath([points[0]]);
        }
      },
      (agent: Agent) => {
        agent.setPath([]);
      }
    );
  }
  
  public createChaseBehavior(targetSelector: (agent: Agent) => [number, number, number] | undefined, updateRate: number = 0.5): BehaviorNode {
    return new Action(
      (agent: Agent, deltaTime: number) => {
        if (!agent.hasBlackboardValue('chaseTimer')) {
          agent.setBlackboardValue('chaseTimer', 0);
        }
        
        let timer = agent.getBlackboardValue('chaseTimer');
        timer += deltaTime;
        agent.setBlackboardValue('chaseTimer', timer);
        
        // Update path at specified rate
        if (timer >= updateRate) {
          agent.setBlackboardValue('chaseTimer', 0);
          
          const targetPosition = targetSelector(agent);
          
          if (!targetPosition) {
            return BehaviorStatus.FAILURE;
          }
          
          agent.setTarget(targetPosition);
          
          // If we have a navigation mesh, find a path
          const aiSystem = AISystem.getInstance();
          if (aiSystem.getNavigationMesh() && agent.getGameObject().transform) {
            const path = aiSystem.findPath(
              agent.getGameObject().transform.position,
              targetPosition
            );
            
            if (path.length > 0) {
              agent.setPath(path);
            } else {
              // Direct path if pathfinding fails
              agent.setPath([targetPosition]);
            }
          } else {
            // Direct path if no navigation mesh
            agent.setPath([targetPosition]);
          }
        }
        
        // Follow the current path
        const pathCompleted = agent.followPath(deltaTime);
        
        // Continue chasing as long as we have a target
        return agent.getTarget() ? BehaviorStatus.RUNNING : BehaviorStatus.SUCCESS;
      },
      (agent: Agent) => {
        agent.setBlackboardValue('chaseTimer', 0);
      },
      (agent: Agent) => {
        agent.setPath([]);
        agent.setTarget(undefined);
        agent.clearBlackboardValue('chaseTimer');
      }
    );
  }
  
  public createWanderBehavior(radius: number = 10, minDistance: number = 5): BehaviorNode {
    return new Action(
      (agent: Agent, deltaTime: number) => {
        if (!agent.getPath().length || agent.followPath(deltaTime)) {
          // Find a new random point to wander to
          const currentPosition = agent.getGameObject().transform?.position || [0, 0, 0];
          
          let wanderTarget: [number, number, number];
          
          if (this.navigationMesh) {
            wanderTarget = this.navigationMesh.getRandomPoint();
          } else {
            // Generate a random point within the specified radius
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * (radius - minDistance);
            wanderTarget = [
              currentPosition[0] + Math.cos(angle) * distance,
              currentPosition[1],
              currentPosition[2] + Math.sin(angle) * distance
            ];
          }
          
          agent.setPath([wanderTarget]);
        }
        
        return BehaviorStatus.RUNNING;
      }
    );
  }
  
  public createFleeFromBehavior(targetSelector: (agent: Agent) => [number, number, number] | undefined, fleeDistance: number = 20): BehaviorNode {
    return new Action(
      (agent: Agent, deltaTime: number) => {
        const targetPosition = targetSelector(agent);
        
        if (!targetPosition) {
          return BehaviorStatus.SUCCESS; // Nothing to flee from
        }
        
        const currentPosition = agent.getGameObject().transform?.position;
        
        if (!currentPosition) {
          return BehaviorStatus.FAILURE;
        }
        
        // Calculate direction away from target
        const dx = currentPosition[0] - targetPosition[0];
        const dy = currentPosition[1] - targetPosition[1];
        const dz = currentPosition[2] - targetPosition[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance >= fleeDistance) {
          return BehaviorStatus.SUCCESS; // We're far enough away
        }
        
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        const dirZ = dz / distance;
        
        // Calculate flee target (opposite direction from threat)
        const fleeTarget: [number, number, number] = [
          currentPosition[0] + dirX * fleeDistance,
          currentPosition[1] + dirY * fleeDistance,
          currentPosition[2] + dirZ * fleeDistance
        ];
        
        // If we have a navigation mesh, find a path
        if (this.navigationMesh) {
          const safestPoint = this.navigationMesh.getClosestPoint(fleeTarget);
          agent.setPath([safestPoint]);
        } else {
          agent.setPath([fleeTarget]);
        }
        
        agent.followPath(deltaTime);
        
        return BehaviorStatus.RUNNING;
      }
    );
  }
}

export default AISystem; 