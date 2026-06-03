import Cocoa
import Foundation

// MARK: - Icon Generator for Invest Record Pro
// Finance-themed icon: dark gradient background + large candlesticks + upward trend + ¥ badge

let SIZE: CGFloat = 1024
let RADIUS: CGFloat = 220

func generateIcon() -> NSImage {
    let image = NSImage(size: NSSize(width: SIZE, height: SIZE))
    image.lockFocus()

    let ctx = NSGraphicsContext.current!.cgContext

    // ── 1. Background: dark blue-purple gradient, rounded square ──
    let bgRect = NSRect(x: 0, y: 0, width: SIZE, height: SIZE)
    let bgPath = NSBezierPath(roundedRect: bgRect, xRadius: RADIUS, yRadius: RADIUS)

    let bgGradient = NSGradient(colors: [
        NSColor(red: 0.12, green: 0.18, blue: 0.35, alpha: 1.0),
        NSColor(red: 0.18, green: 0.24, blue: 0.48, alpha: 1.0),
        NSColor(red: 0.14, green: 0.20, blue: 0.42, alpha: 1.0),
    ])!
    bgGradient.draw(in: bgPath, angle: -45)

    // ── 2. Subtle grid lines ──
    ctx.saveGState()
    bgPath.addClip()
    ctx.setStrokeColor(red: 1, green: 1, blue: 1, alpha: 0.06)
    ctx.setLineWidth(1)

    for i in 1..<8 {
        let y = CGFloat(i) * SIZE / 8
        ctx.move(to: CGPoint(x: 80, y: y))
        ctx.addLine(to: CGPoint(x: SIZE - 80, y: y))
        ctx.strokePath()
    }
    for i in 1..<6 {
        let x = CGFloat(i) * SIZE / 6
        ctx.move(to: CGPoint(x: x, y: 160))
        ctx.addLine(to: CGPoint(x: x, y: SIZE - 160))
        ctx.strokePath()
    }
    ctx.restoreGState()

    // ── 3. Large candlestick bars ──
    func drawCandle(x: CGFloat, bodyTop: CGFloat, bodyBottom: CGFloat, wickTop: CGFloat, wickBottom: CGFloat, isGreen: Bool) {
        let bodyWidth: CGFloat = 72  // wider bars
        ctx.saveGState()
        bgPath.addClip()

        // Wick (thicker)
        ctx.setStrokeColor(red: 1, green: 1, blue: 1, alpha: 0.35)
        ctx.setLineWidth(3)
        ctx.move(to: CGPoint(x: x, y: wickTop))
        ctx.addLine(to: CGPoint(x: x, y: wickBottom))
        ctx.strokePath()

        // Body
        let bodyHeight = bodyTop - bodyBottom
        let rect = NSRect(x: x - bodyWidth / 2, y: bodyBottom, width: bodyWidth, height: bodyHeight)
        let bodyColor: NSColor
        if isGreen {
            bodyColor = NSColor(red: 0.30, green: 0.85, blue: 0.55, alpha: 0.85)
        } else {
            bodyColor = NSColor(red: 0.90, green: 0.35, blue: 0.35, alpha: 0.75)
        }
        bodyColor.setFill()
        let bodyPath = NSBezierPath(roundedRect: rect, xRadius: 8, yRadius: 8)
        bodyPath.fill()

        ctx.restoreGState()
    }

    // Bar 1 (red, short) — center-left area
    drawCandle(x: 280, bodyTop: 580, bodyBottom: 520, wickTop: 630, wickBottom: 470, isGreen: false)
    // Bar 2 (red, medium)
    drawCandle(x: 400, bodyTop: 510, bodyBottom: 410, wickTop: 570, wickBottom: 350, isGreen: false)
    // Bar 3 (green, tall — the big bullish candle)
    drawCandle(x: 530, bodyTop: 530, bodyBottom: 310, wickTop: 600, wickBottom: 240, isGreen: true)

    // ── 4. Upward trend line: bottom-left → top-right ──
    ctx.saveGState()
    bgPath.addClip()

    let trendPoints: [CGPoint] = [
        CGPoint(x: 140, y: 760),
        CGPoint(x: 260, y: 660),
        CGPoint(x: 400, y: 540),
        CGPoint(x: 540, y: 400),
        CGPoint(x: 680, y: 300),
        CGPoint(x: 800, y: 220),
    ]

    // Glow effect (wide, translucent)
    ctx.setStrokeColor(red: 0.95, green: 0.78, blue: 0.20, alpha: 0.18)
    ctx.setLineWidth(32)
    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)
    ctx.move(to: trendPoints[0])
    for i in 1..<trendPoints.count { ctx.addLine(to: trendPoints[i]) }
    ctx.strokePath()

    // Main trend line
    ctx.setStrokeColor(red: 0.95, green: 0.78, blue: 0.20, alpha: 0.9)
    ctx.setLineWidth(7)
    ctx.move(to: trendPoints[0])
    for i in 1..<trendPoints.count { ctx.addLine(to: trendPoints[i]) }
    ctx.strokePath()

    // Arrow tip at end (pointing upper-right)
    let tip = trendPoints.last!
    ctx.setFillColor(red: 0.95, green: 0.78, blue: 0.20, alpha: 1.0)
    let arrow = NSBezierPath()
    arrow.move(to: CGPoint(x: tip.x + 22, y: tip.y - 10))
    arrow.line(to: CGPoint(x: tip.x - 6, y: tip.y - 26))
    arrow.line(to: CGPoint(x: tip.x - 6, y: tip.y + 6))
    arrow.close()
    arrow.fill()

    ctx.restoreGState()

    // ── 5. Area fill under trend line ──
    ctx.saveGState()
    bgPath.addClip()

    let areaPath = CGMutablePath()
    areaPath.move(to: trendPoints[0])
    for i in 1..<trendPoints.count { areaPath.addLine(to: trendPoints[i]) }
    areaPath.addLine(to: CGPoint(x: trendPoints.last!.x, y: 800))
    areaPath.addLine(to: CGPoint(x: trendPoints[0].x, y: 800))
    areaPath.closeSubpath()

    let areaGradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [NSColor(red: 0.95, green: 0.78, blue: 0.20, alpha: 0.25).cgColor,
                 NSColor(red: 0.95, green: 0.78, blue: 0.20, alpha: 0.02).cgColor] as CFArray,
        locations: [0.0, 1.0])!

    ctx.addPath(areaPath)
    ctx.clip(using: .evenOdd)
    ctx.drawLinearGradient(areaGradient,
        start: CGPoint(x: 0, y: 220),
        end: CGPoint(x: 0, y: 800),
        options: [])

    ctx.restoreGState()

    // ── 6. ¥ badge — top-right corner ──
    ctx.saveGState()
    bgPath.addClip()

    let coinCenter = CGPoint(x: 830, y: 850)  // screen coords: top-right
    let coinRadius: CGFloat = 68

    // Coin glow
    let coinGlow = NSColor(red: 0.95, green: 0.78, blue: 0.20, alpha: 0.2)
    let glowRect = NSRect(x: coinCenter.x - coinRadius - 14, y: coinCenter.y - coinRadius - 14,
                          width: (coinRadius + 14) * 2, height: (coinRadius + 14) * 2)
    coinGlow.setFill()
    NSBezierPath(ovalIn: glowRect).fill()

    // Coin circle
    let coinGradient = NSGradient(colors: [
        NSColor(red: 1.0, green: 0.85, blue: 0.30, alpha: 1.0),
        NSColor(red: 0.85, green: 0.65, blue: 0.10, alpha: 1.0),
    ])!
    coinGradient.draw(in: NSBezierPath(ovalIn: NSRect(x: coinCenter.x - coinRadius, y: coinCenter.y - coinRadius,
                                                       width: coinRadius * 2, height: coinRadius * 2)),
                      angle: -90)

    // "¥" symbol on coin
    let yenStyle = NSMutableParagraphStyle()
    yenStyle.alignment = .center
    let yenAttrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.boldSystemFont(ofSize: 62),
        .foregroundColor: NSColor(red: 0.45, green: 0.30, blue: 0.05, alpha: 1.0),
        .paragraphStyle: yenStyle,
    ]
    let yenStr = NSAttributedString(string: "¥", attributes: yenAttrs)
    let yenSize = yenStr.size()
    yenStr.draw(at: CGPoint(x: coinCenter.x - yenSize.width / 2, y: coinCenter.y - yenSize.height / 2 + 4))

    ctx.restoreGState()

    // ── 7. Top shine effect (glass morphism) ──
    ctx.saveGState()
    bgPath.addClip()

    let shineGradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [NSColor(red: 1, green: 1, blue: 1, alpha: 0.12).cgColor,
                 NSColor(red: 1, green: 1, blue: 1, alpha: 0.0).cgColor] as CFArray,
        locations: [0.0, 1.0])!

    let shineRect = NSRect(x: 0, y: SIZE * 0.5, width: SIZE, height: SIZE * 0.5)
    ctx.addPath(bgPath.cgPath)
    ctx.clip(using: .evenOdd)
    ctx.drawLinearGradient(shineGradient,
        start: CGPoint(x: 0, y: shineRect.maxY),
        end: CGPoint(x: 0, y: shineRect.minY),
        options: [])

    ctx.restoreGState()

    image.unlockFocus()
    return image
}

// MARK: - Main

let icon = generateIcon()

if let tiffData = icon.tiffRepresentation,
   let bitmap = NSBitmapImageRep(data: tiffData),
   let pngData = bitmap.representation(using: .png, properties: [:]) {
    let outputPath = "src-tauri/icons/icon-1024.png"
    try! pngData.write(to: URL(fileURLWithPath: outputPath))
    print("✅ Icon saved to \(outputPath)")
} else {
    print("❌ Failed to generate PNG")
}
