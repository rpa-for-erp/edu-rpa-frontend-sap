import {
  FormControl,
  FormLabel,
  Select,
  RadioGroup,
  Stack,
  Radio,
  Input,
  Box,
} from '@chakra-ui/react';
import { useSelector, useDispatch } from 'react-redux';
import { scheduleSelector } from '@/redux/selector';
import {
  setScheduleType,
  setDatetime,
  setMinute,
  setHour,
  setDayOfMonth,
  setMonth,
  setDayOfWeek,
  setYear,
  setTimezone,
  setRateValue,
  setRateUnit,
} from '@/redux/slice/scheduleSlice';
import { useTranslation } from 'next-i18next';

const ScheduleForm = () => {
  const { t } = useTranslation('robot');
  const schedule = useSelector(scheduleSelector);
  const dispatch = useDispatch();

  return (
    <Box p={5}>
      <FormControl>
        <FormLabel>{t('scheduleForm.timezone')}</FormLabel>
        <Select
          value={schedule.timezone}
          onChange={(e) => dispatch(setTimezone(e.target.value))}
        >
          {Array(24)
            .fill(0)
            .map((_, idx) => (
              <option
                key={idx}
                value={`UTC+${idx < 10 ? '0' + idx : idx}:00`}
              >{`UTC+${idx < 10 ? '0' + idx : idx}:00`}</option>
            ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>{t('scheduleForm.scheduleType')}</FormLabel>
        <RadioGroup
          value={schedule.type}
          onChange={(value) => dispatch(setScheduleType(value))}
        >
          <Stack direction="row">
            <Radio value="at">{t('scheduleForm.once')}</Radio>
            <Radio value="cron">{t('scheduleForm.recurring')}</Radio>
            <Radio value="rate">Interval</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      {schedule.type === 'at' ? (
        <FormControl mt={5}>
          <FormLabel>{t('scheduleForm.datetime')}</FormLabel>
          <Input
            type="datetime-local"
            value={schedule.datetime}
            onChange={(e) => dispatch(setDatetime(e.target.value))}
          />
        </FormControl>
      ) : schedule.type === 'cron' ? (
        <Box>
          <FormControl mt={5}>
            <FormLabel>{t('scheduleForm.minute')}</FormLabel>
            <Input
              type="text"
              placeholder={t('scheduleForm.minute')}
              value={schedule.minute}
              onChange={(e) => dispatch(setMinute(e.target.value))}
            />
          </FormControl>

          <FormControl mt={5}>
            <FormLabel>{t('scheduleForm.hour')}</FormLabel>
            <Input
              type="text"
              placeholder={t('scheduleForm.hour')}
              value={schedule.hour}
              onChange={(e) => dispatch(setHour(e.target.value))}
            />
          </FormControl>

          <FormControl mt={5}>
            <FormLabel>{t('scheduleForm.dayOfMonth')}</FormLabel>
            <Input
              type="text"
              placeholder={t('scheduleForm.dayOfMonth')}
              value={schedule.dayOfMonth}
              onChange={(e) => dispatch(setDayOfMonth(e.target.value))}
            />
          </FormControl>

          <FormControl mt={5}>
            <FormLabel>{t('scheduleForm.month')}</FormLabel>
            <Input
              type="text"
              placeholder={t('scheduleForm.month')}
              value={schedule.month}
              onChange={(e) => dispatch(setMonth(e.target.value))}
            />
          </FormControl>

          <FormControl mt={5}>
            <FormLabel>{t('scheduleForm.dayOfWeek')}</FormLabel>
            <Input
              type="text"
              placeholder={t('scheduleForm.dayOfWeek')}
              value={schedule.dayOfWeek}
              onChange={(e) => dispatch(setDayOfWeek(e.target.value))}
            />
          </FormControl>

          <FormControl mt={5}>
            <FormLabel>{t('scheduleForm.year')}</FormLabel>
            <Input
              type="text"
              placeholder={t('scheduleForm.year')}
              value={schedule.year}
              onChange={(e) => dispatch(setYear(e.target.value))}
            />
          </FormControl>
        </Box>
      ) : schedule.type === 'rate' ? (
        <Box>
          <FormControl mt={5}>
            <FormLabel>Value</FormLabel>
            <Input
              type="number"
              placeholder="Value"
              value={schedule.value}
              onChange={(e) => dispatch(setRateValue(parseInt(e.target.value)))}
            />
          </FormControl>

          <FormControl mt={5}>
            <FormLabel>Unit</FormLabel>
            <Select
              value={schedule.unit}
              onChange={(e) => dispatch(setRateUnit(e.target.value))}
            >
              <option value="minutes">Minute</option>
              <option value="hours">Hour</option>
              <option value="days">Day</option>
            </Select>
          </FormControl>
        </Box>
      ) : null}
    </Box>
  );
};
export default ScheduleForm;
