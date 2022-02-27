
#include <string.h>

unsigned char channel_1 = 4;
unsigned char channel_2 = 5;
unsigned char channel_3 = 6;
unsigned char channel_4 = 7;

// Storage vars
char pin_chunk[2];
char state_chunk[2];
char time_chunk[5];

const unsigned int MAX_MESSAGE_LENGTH = 10;

unsigned int message_pos = 0;

unsigned int time_pos = 0;

unsigned int chunk_cnt = 0;
void setup()
{

    // CH1=CH2=CH3=CH4=CH5=CH6=CH7=CH8=high;

    pinMode(channel_1, OUTPUT); // Set AC Load pin as output
    pinMode(channel_2, OUTPUT); // Set AC Load pin as output
    pinMode(channel_3, OUTPUT); // Set AC Load pin as output
    pinMode(channel_4, OUTPUT); // Set AC Load pin as output

    digitalWrite(channel_1, HIGH);
    digitalWrite(channel_2, HIGH);
    digitalWrite(channel_3, HIGH);
    digitalWrite(channel_4, HIGH);
    Serial.begin(256000);
}

void loop()
{
    // <channels>|start|end|time
    while (Serial.available() > 0)
    {
        char inByte = Serial.read();
        if (inByte != '\n' && (message_pos < MAX_MESSAGE_LENGTH - 1))
        {
            if (message_pos < 1)
            {
                pin_chunk[0] = inByte;
            }
            else if (message_pos < 2)
            {
                state_chunk[0] = inByte;
            }
            else
            {
                time_chunk[time_pos] = inByte;
                time_pos++;
            }

            message_pos++;
        }
        else
        {

            pin_chunk[1] = '\0';
            state_chunk[1] = '\0';
            time_chunk[time_pos + 1] = '\0';

            unsigned int pin = atoi(pin_chunk);
            unsigned int state = atoi(state_chunk);
            unsigned int delay_time = atoi(time_chunk);

            digitalWrite(pin, state == 1 ? LOW : HIGH);
            delay(delay_time);
            digitalWrite(pin, state == 1 ? HIGH : LOW);

            resetStorage();
        }
    }
}

void resetStorage()
{
    time_pos = 0;
    message_pos = 0;

    memset(pin_chunk, 0, sizeof(pin_chunk));
    memset(state_chunk, 0, sizeof(state_chunk));
    memset(time_chunk, 0, sizeof(time_chunk));
}
