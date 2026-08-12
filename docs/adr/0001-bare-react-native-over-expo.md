# Bare React Native CLI over Expo

We're building with the bare React Native CLI instead of Expo's managed workflow. Expo's EAS Build service and default managed-workflow tooling introduce a dependency on Expo's cloud infrastructure that conflicts with the goal of fully local, reproducible builds needed for F-Droid distribution. Bare RN keeps the Android/iOS projects buildable directly from source with standard Gradle/Xcode tooling.
