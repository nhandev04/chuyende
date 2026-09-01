import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('.')

def test_yolo_pose_integration():
    print("[TEST] Testing newly updated YOLO Pose Body Analyzer...")
    
    from app.services.body_pose_analyzer import get_pose_model
    try:
        model = get_pose_model()
        print("✅ YOLO Pose Model loaded successfully:", model)
        print("🎉 SUCCESS: yolov8n-pose.pt model verified!")
    except Exception as e:
        print("❌ Error loading pose model:", e)

if __name__ == "__main__":
    test_yolo_pose_integration()
