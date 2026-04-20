export type DemoConfig = {
  characterUrl: string;
  animationUrl: string;
  animationGroupName?: string;
  animationSpeed: number;
  loop: boolean;
  retarget: {
    rootNodeName?: string;
    groundReferenceNodeName?: string;
    mapNodeNames?: Map<string, string>;
  };
};

const createRetargetMap = () =>
  new Map<string, string>([
    ["mixamorig:Hips", "Hips"],
    ["mixamorig:Spine", "Spine"],
    ["mixamorig:Spine1", "Spine1"],
    ["mixamorig:Spine2", "Spine2"],
    ["mixamorig:Neck", "Neck"],
    ["mixamorig:Head", "Head"],
    ["mixamorig:LeftShoulder", "LeftShoulder"],
    ["mixamorig:LeftArm", "LeftArm"],
    ["mixamorig:LeftForeArm", "LeftForeArm"],
    ["mixamorig:LeftHand", "LeftHand"],
    ["mixamorig:RightShoulder", "RightShoulder"],
    ["mixamorig:RightArm", "RightArm"],
    ["mixamorig:RightForeArm", "RightForeArm"],
    ["mixamorig:RightHand", "RightHand"],
    ["mixamorig:LeftUpLeg", "LeftUpLeg"],
    ["mixamorig:LeftLeg", "LeftLeg"],
    ["mixamorig:LeftFoot", "LeftFoot"],
    ["mixamorig:LeftToeBase", "LeftToeBase"],
    ["mixamorig:RightUpLeg", "RightUpLeg"],
    ["mixamorig:RightLeg", "RightLeg"],
    ["mixamorig:RightFoot", "RightFoot"],
    ["mixamorig:RightToeBase", "RightToeBase"],
    ["Hips_23", "Hips_02"],
    ["Spline_12", "Spine_03"],
    ["Head_1", "Head_06"],
    ["LeftShoulder_6", "Left shoulder_058"],
    ["LeftArm_5", "Left arm_059"],
    ["LeftForeArm_4", "Left elbow_061"],
    ["LeftHand_3", "Left wrist_063"],
    ["RightShoulder_11", "Right shoulder_084"],
    ["RightArm_10", "Right arm_085"],
    ["RightForeArm_9", "Right elbow_087"],
    ["RightHand_8", "Right wrist_089"],
    ["LeftUpLeg_17", "Left leg_0120"],
    ["LeftLeg_16", "Left knee_0121"],
    ["LeftFoot_15", "Left ankle_0122"],
    ["LeftToeBase_14", "Left toe_0123"],
    ["RightUpLeg_22", "Right leg_0124"],
    ["RightLeg_21", "Right knee_0125"],
    ["RightFoot_20", "Right ankle_0126"],
    ["RightToeBase_19", "Right toe_0127"],
  ]);

export const demoConfig: DemoConfig = {
  characterUrl: "/assets/models/furina-unpacked/source/genshin_impact_-_furina%20(1).glb",
  animationUrl: "/assets/animations/walking-glb-inspect/scene.gltf",
  animationSpeed: 1,
  loop: true,
  retarget: {
    rootNodeName: "Hips_23",
    groundReferenceNodeName: "LeftFoot_15",
    mapNodeNames: createRetargetMap(),
  },
};
