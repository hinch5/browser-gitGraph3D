attribute vec position;
attribute vec4 color;

varying lowp vec4 outColor;

uniform mat4 model;

void main()
{
    gl_Position = model*position;
    outColor = color;
}