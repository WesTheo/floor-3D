attribute vec2 position;
varying vec2 vPos;
void main(){
  vPos = position * 0.5 + 0.5;          // 0..1
  gl_Position = vec4(position, 0.0, 1.0);
}
