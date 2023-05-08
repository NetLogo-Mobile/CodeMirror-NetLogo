import * as File from 'fs';
import path from 'path';
// Thanks to the stupidity of TypeScript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Log } from '../../codemirror/utils/debug-utils.ts';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {
  Primitive,
  NetLogoType,
  AgentContexts,
  Argument,
} from '../classes/structures.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Commands } from './core/commands.ts';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Reporters } from './core/reporters.ts';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { NLArgument, NLPrimitive, NLWPrimitive } from './nlstructures.ts';

/** PrimitiveImporter: A quick node.js script to import NL/NLW primitives for the editor. */
// Use with 'npm run import'
class PrimitiveImporter {
  /** Primitives: The list of imported primitives. */
  private Primitives: Primitive[] = [];

  /** Import: Import all primitives. */
  public Import() {
    // Core ones
    for (var Primitive of Reporters) this.ImportNL('', Primitive);
    for (var Primitive of Commands) this.ImportNL('', Primitive);
    // Extensions ones
    const Extensions = './src/lang/primitives/extensions';
    File.readdirSync(Extensions).forEach((Path) => {
      if (!Path.endsWith('.json')) return;
      const Extension = path.parse(Path).name;
      const Metadata: any = JSON.parse(
        File.readFileSync(path.join(Extensions, Path), 'utf8')
      );
      Metadata.prims.forEach((Primitive: NLWPrimitive) =>
        this.ImportNLW(Extension, Primitive)
      );
    });
  }
  /** Export: Export all primitives to a file. */
  public Export() {
    File.writeFileSync(
      './src/lang/primitives/dataset.ts',
      `import { Primitive } from '../classes/structures';
export const Dataset: Primitive[] = ${JSON.stringify(this.Primitives)}`
    );
  }

  /** ImportNLW: Import primitive metadatas from NLW. */
  public ImportNLW(Extension: string, Source: NLWPrimitive) {
    const Name = Source.name.toLowerCase();
    const Primitive = {
      Extension: Extension,
      Name: Name,
      LeftArgumentType: this.ConvertToArgument('unit'),
      RightArgumentTypes: this.ConvertToArguments(Source.argTypes),
      ReturnType: this.ConvertToArgument(Source.returnType ?? 'unit'),
      AgentContext: new AgentContexts(Source.agentClassString),
      Precedence: 0, // Needs to check with the actual code
    };
    this.Primitives.push(Primitive);
  }
  /** ImportNL: Import primitive metadatas from NetLogo. */
  public ImportNL(Extension: string, Source: NLPrimitive) {
    const Name = Source.name.toLowerCase();
    const Primitive = {
      Extension: Extension,
      Name: Name,
      LeftArgumentType: this.ConvertToArgument(Source.syntax.left),
      RightArgumentTypes: this.ConvertToArguments(Source.syntax.right),
      ReturnType: this.ConvertToArgument(Source.syntax.ret),
      Precedence: Source.syntax.precedence,
      AgentContext: new AgentContexts(Source.syntax.agentClassString),
      BlockContext:
        Source.syntax.blockAgentClassString == 'null'
          ? new AgentContexts(Source.syntax.agentClassString)
          : new AgentContexts(Source.syntax.blockAgentClassString),
      DefaultOption:
        Source.syntax.defaultOption == null
          ? undefined
          : Source.syntax.defaultOption,
      MinimumOption:
        Source.syntax.minimumOption == null
          ? undefined
          : Source.syntax.minimumOption,
      IsRightAssociative: Source.syntax.isRightAssociative ? true : undefined,
      IntroducesContext:
        Source.syntax.introducesContext == 'true' ? true : undefined,
      CanBeConcise: Source.syntax.canBeConcise ? true : undefined,
      InheritParentContext: Source.syntax.blockAgentClassString == 'null',
    };
    this.Primitives.push(Primitive);
  }

  /** SimpleArguments: The cache for simple arguments. */
  private SimpleArguments: Map<string, Argument> = new Map<string, Argument>();
  /** ConvertToArguments: Convert NetLogo arguments to our format. */
  private ConvertToArguments(Items: (string | NLArgument)[]): Argument[] {
    return Items.map((Item) => this.ConvertToArgument(Item));
  }
  /** ConvertToArgument: Convert a NetLogo argument to our format. */
  private ConvertToArgument(Item: string | NLArgument): Argument {
    if (typeof Item == 'string') {
      return {
        Types: [this.ConvertToType(Item)],
        CanRepeat: false,
        Optional: false,
      };
    } else if (Item.type) {
      return {
        Types: [this.ConvertToType(Item.type)],
        CanRepeat: Item.isRepeatable ?? false,
        Optional: Item.isOptional ?? false,
      };
    } else {
      return {
        Types: Item.types?.map((i: string) => this.ConvertToType(i)) ?? [],
        CanRepeat: Item.isRepeatable ?? false,
        Optional: Item.isOptional ?? false,
      };
    }
  }
  /** ConvertType: Convert a NetLogo Type string to our format. */
  private ConvertToType(Type: string): NetLogoType {
    if (Type == 'unit') {
      return NetLogoType.Unit;
    } else if (Type == 'wildcard') {
      return NetLogoType.Wildcard;
    } else if (Type == 'string') {
      return NetLogoType.String;
    } else if (Type == 'number') {
      return NetLogoType.Number;
    } else if (Type == 'list') {
      return NetLogoType.List;
    } else if (Type == 'boolean') {
      return NetLogoType.Boolean;
    } else if (Type == 'agent') {
      return NetLogoType.Agent;
    } else if (Type == 'agentset' || Type.indexOf('agentset') > -1) {
      return NetLogoType.AgentSet;
    } else if (Type == 'commandblock') {
      return NetLogoType.CommandBlock;
    } else if (Type == 'nobody') {
      return NetLogoType.Nobody;
    } else if (Type == 'codeblock') {
      return NetLogoType.CodeBlock;
    } else if (Type == 'numberblock') {
      return NetLogoType.NumberBlock;
    } else if (Type == 'reporter') {
      return NetLogoType.Reporter;
    } else if (Type == 'turtle') {
      return NetLogoType.Turtle;
    } else if (Type == 'patch') {
      return NetLogoType.Patch;
    } else if (Type == 'link') {
      return NetLogoType.Link;
    } else if (Type == 'symbol') {
      return NetLogoType.Symbol;
    } else if (Type == 'linkset') {
      return NetLogoType.LinkSet;
    } else if (Type == 'reporterblock') {
      return NetLogoType.ReporterBlock;
    } else if (Type == 'booleanblock') {
      return NetLogoType.BooleanBlock;
    } else if (Type == 'command') {
      return NetLogoType.Command;
    } else {
      Log('Unrecognized type: ' + Type);
      return NetLogoType.Other;
    }
  }
}

// Run the script
var Importer = new PrimitiveImporter();
Importer.Import();
Importer.Export();
